import { BigNumber } from 'ethers';
import { ZERO, ONE } from '../../constants';
import { generateMerkleLeaf } from '../../utils';
import keccak256 from 'keccak256';
import MerkleTree from 'merkletreejs';
import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../../constants';
const s3 = new AWS.S3({ region: 'us-west-2' });

export const createMerkleTree_generateTrees = async function createMerkleTree_generateTrees(
  bribeIds: string[],
  bribeIdToGaugeMap: Map<string, string>,
  bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }>,
  processedBribeIds: string[],
  gaugesToVoteProportion: Map<string, Map<string, BigNumber>>
): Promise<void> {
  // Create leaves for each bribeId merkle tree
  const bribeIdMerkleTrees: {
    [bribeId: string]: { bribeId: string; token: string; merkleRoot: string; merkleTree: MerkleTree };
  } = {};

  bribeIds
    .filter((bribeId) => !processedBribeIds.includes(bribeId))
    .forEach((bribeId) => {
      const totalBribeAmount = bribeIdToInfoMap.get(bribeId)?.amount || ZERO;
      const token = bribeIdToInfoMap.get(bribeId)?.token || '';
      if (token === '') {
        throw new Error(`token not found for bribe BribeID ${bribeId}`);
      }

      const gauge = bribeIdToGaugeMap.get(bribeId) || '';
      if (gauge === '') {
        throw new Error(`BribeID ${bribeId} not found in bribeIdToGaugeMap`);
      }

      const merkleLeaves: Buffer[] = [];

      gaugesToVoteProportion.forEach((voterToVoteProportionInnerMap, gauge) => {
        voterToVoteProportionInnerMap.forEach((voteProportion, voter) => {
          merkleLeaves.push(generateMerkleLeaf(voter, voteProportion.mul(totalBribeAmount).div(ONE)));
        });
      });

      const merkleTree = new MerkleTree(merkleLeaves, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot();
      bribeIdMerkleTrees[bribeId] = { bribeId: bribeId, token: token, merkleRoot: merkleRoot, merkleTree: merkleTree };
      // We are mutating a parameter here, however we can't avoid using an impure function when we're querying and writing to some external state.
      processedBribeIds.push(bribeId);
    });

  const saveMerkleTreeToS3Promises = Object.keys(bribeIdMerkleTrees).map((bribeId) => {
    return s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: bribeId,
        Body: JSON.stringify(bribeIdMerkleTrees[bribeId]),
      })
      .promise();
  });

  // Also update processedBribeIds array
  saveMerkleTreeToS3Promises.push(
    s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: 'ProcessedBribeIds',
        Body: JSON.stringify(Array.from(processedBribeIds)),
      })
      .promise()
  );

  await Promise.all(saveMerkleTreeToS3Promises);
  return;
};
