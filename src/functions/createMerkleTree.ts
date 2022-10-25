import {
  createMerkleTree_parseVoteForGaugeEvents,
  createMerkleTree_LoadData,
  createMerkleTree_generateTrees,
  createMerkleTree_saveToAWS,
} from './subfunctions';

// Get all proposalIDs from S3 `ParseBribeDepositResults` objects, and creates Merkle trees for previously unprocessed bribeIds.
export const createMerkleTree = async function createMerkleTree() {
  const { bribeIds, bribeIdToGaugeMap, bribeIdToInfoMap, processedBribeIds, voteForGaugeEvents } =
    await createMerkleTree_LoadData();
  const { gaugesToVoteProportion } = await createMerkleTree_parseVoteForGaugeEvents(voteForGaugeEvents);
  const { newProcessedBribeIds, bribeIdMerkleTrees, merkleLeafPutRequests } = await createMerkleTree_generateTrees(
    bribeIds,
    bribeIdToGaugeMap,
    bribeIdToInfoMap,
    processedBribeIds,
    gaugesToVoteProportion
  );
  await createMerkleTree_saveToAWS(newProcessedBribeIds, bribeIdMerkleTrees, merkleLeafPutRequests);
};
