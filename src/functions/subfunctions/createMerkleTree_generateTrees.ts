import { BigNumber } from 'ethers';
import { ZERO, ONE } from '../../constants';
import { MerkleTreeCollection, MerkleLeafPutRequest } from '../../types';
import { generateMerkleLeaf } from '../../utils';
import keccak256 from 'keccak256';
import MerkleTree from 'merkletreejs';

export const createMerkleTree_generateTrees = async function createMerkleTree_generateTrees(
  bribeIds: string[],
  bribeIdToGaugeMap: Map<string, string>,
  bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }>,
  processedBribeIds: string[],
  gaugesToVoteProportion: Map<string, Map<string, BigNumber>>
): Promise<{
  newProcessedBribeIds: string[];
  bribeIdMerkleTrees: MerkleTreeCollection;
  merkleLeafPutRequests: MerkleLeafPutRequest[];
}> {
  // This line of code is for reading purposes only, we would like to pretend that we are creating a new variable that is a deep clone of 'newProcessedBribeIds', however it is actually a copy by reference so the original 'processedBribeIds' parameter is altered anyway.
  const newProcessedBribeIds = processedBribeIds;
  // Create leaves for each bribeId merkle tree
  const bribeIdMerkleTrees: MerkleTreeCollection = {};
  const merkleLeafPutRequests: MerkleLeafPutRequest[] = [];

  bribeIds
    // .filter((bribeId) => !processedBribeIds.includes(bribeId))
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

      const voterToVoteProportionInnerMap = gaugesToVoteProportion.get(gauge) || new Map<string, BigNumber>();

      const voterSet: Set<string> = new Set();
      voterToVoteProportionInnerMap.forEach((voteProportion, voter) => {
        // Check for duplicate voters
        if (voterSet.has(voter)) {
          throw new Error(
            `createMerkleTree_generateTrees - duplicate voter ${voter} for bribeId ${bribeId} and gauge ${gauge}`
          );
        }

        voterSet.add(voter);

        const individualBribeAmount = voteProportion.mul(totalBribeAmount).div(ONE);
        // Here need input correlating DynamoDB data entries.
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
        merkleLeaves.push(generateMerkleLeaf(voter, individualBribeAmount));
      });

      const merkleTree = new MerkleTree(merkleLeaves, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot();
      bribeIdMerkleTrees[bribeId] = { bribeId: bribeId, token: token, merkleRoot: merkleRoot, merkleTree: merkleTree };
      // We are mutating a parameter here, however we can't avoid using an impure function when we're querying and writing to some external state.
      newProcessedBribeIds.push(bribeId);
    });

  return {
    newProcessedBribeIds: newProcessedBribeIds,
    bribeIdMerkleTrees: bribeIdMerkleTrees,
    merkleLeafPutRequests: merkleLeafPutRequests,
  };
};
