import { BigNumber } from 'ethers';
import { ZERO, ONE } from '../../constants';
import { MerkleTreeCollection, MerkleLeafPutRequest } from '../../types';
import { generateMerkleLeaf } from '../../utils';
import keccak256 from 'keccak256';
import MerkleTree from 'merkletreejs';

export const createMerkleTree_generateTrees = function createMerkleTree_generateTrees(
  bribeIds: string[],
  bribeIdToGaugeMap: Map<string, string>,
  bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }>,
  processedBribeIds: string[],
  gaugesToVoteProportion: Map<string, Map<string, BigNumber>>
): {
  newProcessedBribeIds: string[];
  bribeIdMerkleTrees: MerkleTreeCollection;
  merkleLeafPutRequests: MerkleLeafPutRequest[];
} {
  const newProcessedBribeIds = processedBribeIds;
  const bribeIdMerkleTrees: MerkleTreeCollection = {};
  const merkleLeafPutRequests: MerkleLeafPutRequest[] = [];

  // Create merkle tree leaves for each bribeId
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
      const voterSet: Set<string> = new Set();
      const voterToVoteProportionInnerMap = gaugesToVoteProportion.get(gauge) || new Map<string, BigNumber>();
      voterToVoteProportionInnerMap.forEach((voteProportion, voter) => {
        // Check for duplicate voters
        if (voterSet.has(voter)) {
          throw new Error(
            `createMerkleTree_generateTrees - duplicate voter ${voter} for bribeId ${bribeId} and gauge ${gauge}`
          );
        }

        voterSet.add(voter);

        // Create merkle leaf node.
        const individualBribeAmount = voteProportion.mul(totalBribeAmount).div(ONE);
        merkleLeaves.push(generateMerkleLeaf(voter, individualBribeAmount));

        // Create DynamoDB put request for leaf node.
        merkleLeafPutRequests.push({
          PutRequest: {
            Item: {
              voter: { S: voter },
              bribeId: { S: bribeId },
              token: { S: token },
              amount: { S: individualBribeAmount.toString() },
            },
          },
        });
      });

      const merkleTree = new MerkleTree(merkleLeaves, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot();
      bribeIdMerkleTrees[bribeId] = { bribeId: bribeId, token: token, merkleRoot: merkleRoot, merkleTree: merkleTree };
      newProcessedBribeIds.push(bribeId);
    });

  return {
    newProcessedBribeIds: newProcessedBribeIds,
    bribeIdMerkleTrees: bribeIdMerkleTrees,
    merkleLeafPutRequests: merkleLeafPutRequests,
  };
};
