import { Claim, MerkleDBQuery } from '../types';
import keccak256 from 'keccak256';
import { contracts } from '../network';
import { Contract } from 'ethers';
import AWS from 'aws-sdk';
import { TABLE_NAME, BUCKET_NAME } from '../constants';
import { generateMerkleLeaf } from '../utils';
const dynamodb = new AWS.DynamoDB({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
import MerkleTree from 'merkletreejs';

// Get all eligible claims for a voter, and also provide required RewardDistributor.claims() parameters.
export const getClaims = async function getClaims(address: string): Promise<Claim[]> {
  const rewardDistributor: Contract = contracts['RewardDistributor'];
  const eventFilter = rewardDistributor.filters.RewardClaimed(null, null, address);

  // Get DynamoDB entries
  const queryRequest = {
    TableName: TABLE_NAME,
    KeyConditionExpression: `voter = :addressValue`,
    ExpressionAttributeValues: { [':addressValue']: { S: address } },
  };

  const [dynamodbQuery, rewardClaimedEvents] = await Promise.all([
    dynamodb.query(queryRequest).promise(),
    rewardDistributor.queryFilter(eventFilter),
  ]);

  const claimedBribeIds = rewardClaimedEvents.map((event) => event?.args?.identifier);

  // Filter out dynamodb entries corresponding to previous claims.
  const filteredDbEntries = dynamodbQuery?.Items?.filter(
    (item) => !claimedBribeIds.includes(item?.bribeId['S'])
  ) as MerkleDBQuery[];

  // Get Merkle Trees from S3
  const merkleTreeQueries = filteredDbEntries
    .map((item) => item?.bribeId['S'])
    .map((bribeId) =>
      s3
        .getObject({
          Bucket: BUCKET_NAME,
          Key: bribeId,
        })
        .promise()
    );

  const merkleTrees = (await Promise.all(merkleTreeQueries)).map((resp) => JSON.parse(String(resp?.Body)));

  const claims: Claim[] = filteredDbEntries?.map((entry, index) => {
    // Reconstruct MerkleTree object
    const merkleTree = new MerkleTree(
      merkleTrees[index].merkleTree.leaves.map((leaf) => Buffer.from(leaf?.data)),
      keccak256,
      { sortPairs: true }
    );

    if (merkleTree.getHexRoot() !== merkleTrees[index].merkleRoot) {
      throw new Error('getClaims - Did not correctly reconstruct stored merkle tree');
    }

    // Get leaf
    const leaf = generateMerkleLeaf(entry?.voter['S'], entry?.amount['S']);

    const claim: Claim = {
      token: entry?.token['S'],
      amount: entry?.amount['S'],
      claimParams: {
        identifier: entry?.bribeId['S'],
        account: address,
        amount: entry?.amount['S'],
        merkleProof: merkleTree.getHexProof(leaf),
      },
    };

    return claim;
  });

  return claims;
};
