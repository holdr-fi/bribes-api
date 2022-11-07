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

/*
 * To claim bribe rewards, voters need to call RewardDistributor.claim(Claim[] calldata _claims)
 *
 * struct Claim {
 *      bytes32 identifier;
 *      address account;
 *      uint256 amount;
 *      bytes32[] merkleProof;
 * }
 *
 * getClaims takes a voter address, and returns all eligible claims.
 */
export const getClaims = async function getClaims(address: string): Promise<Claim[]> {
  const rewardDistributor: Contract = contracts['RewardDistributor'];
  const eventFilter = rewardDistributor.filters.RewardClaimed(null, null, address);

  // Get all leaf nodes created for given address from DynamoDB.
  const queryRequest = {
    TableName: TABLE_NAME,
    KeyConditionExpression: `voter = :addressValue`,
    ExpressionAttributeValues: { [':addressValue']: { S: address } },
  };

  const [allMerkleLeaves, rewardClaimedEvents] = await Promise.all([
    dynamodb.query(queryRequest).promise(),
    rewardDistributor.queryFilter(eventFilter),
  ]);

  // Get bribeIds used in previous claims.
  const claimedBribeIds = rewardClaimedEvents.map((event) => event?.args?.identifier);

  // Filter out leaf nodes corresponding to previous claims.
  const unusedMerkleLeaves = allMerkleLeaves?.Items?.filter(
    (item) => !claimedBribeIds.includes(item?.bribeId['S'])
  ) as MerkleDBQuery[];

  // Get Merkle Trees for unused merkle leaves from S3.
  const merkleTreeQueries = unusedMerkleLeaves
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

  // Strip DynamoDB return object of DynamoDB formatting to enable unit tests.
  const formattedUnusedMerkleLeaves = unusedMerkleLeaves.map((entry) => {
    return {
      token: entry?.token['S'],
      amount: entry?.amount['S'],
      bribeId: entry?.bribeId['S'],
      voter: entry?.voter['S'],
    };
  });

  // Construct claim() parameter for unused merkle leaves.
  const claims: Claim[] = formattedUnusedMerkleLeaves.map((entry, index) => {
    // Reconstruct MerkleTree object
    const merkleTree = new MerkleTree(
      // Convert from deserialized JSON into Buffer.
      merkleTrees[index].merkleTree.leaves.map((leaf) => Buffer.from(leaf?.data)),
      keccak256,
      { sortPairs: true }
    );

    if (merkleTree.getHexRoot() !== merkleTrees[index].merkleRoot) {
      throw new Error('getClaims - Did not correctly reconstruct stored merkle tree');
    }

    // Get leaf
    const leaf = generateMerkleLeaf(entry?.voter, entry?.amount);

    const claim: Claim = {
      token: entry?.token,
      amount: entry?.amount,
      claimParams: {
        identifier: entry?.bribeId,
        account: address,
        amount: entry?.amount,
        merkleProof: merkleTree.getHexProof(leaf),
      },
    };

    return claim;
  });

  return claims;
};
