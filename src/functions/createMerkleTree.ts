import {
  createMerkleTree_parseVoteForGaugeEvents,
  createMerkleTree_LoadData,
  createMerkleTree_generateTrees,
} from './subfunctions';

// Get all proposalIDs from S3 `ParseBribeDepositResults` objects
export const createMerkleTree = async function createMerkleTree() {
  const { bribeIds, bribeIdToGaugeMap, bribeIdToInfoMap, processedBribeIds, voteForGaugeEvents } =
    await createMerkleTree_LoadData();
  const { gaugesToVoteProportion } = await createMerkleTree_parseVoteForGaugeEvents(voteForGaugeEvents);
  await createMerkleTree_generateTrees(
    bribeIds,
    bribeIdToGaugeMap,
    bribeIdToInfoMap,
    processedBribeIds,
    gaugesToVoteProportion
  );
};
