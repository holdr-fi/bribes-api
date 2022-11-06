import {
  createMerkleTree_parseVoteForGaugeEvents,
  createMerkleTree_parseBribeIds,
  createMerkleTree_generateTrees,
  createMerkleTree_saveToAWS,
  createMerkleTree_loadFromAWS,
} from './subfunctions';

export const createMerkleTree = async function createMerkleTree() {
  const [awsData, wrappedGaugesToVoteProportion] = await Promise.all([
    createMerkleTree_loadFromAWS(),
    createMerkleTree_parseVoteForGaugeEvents(),
  ]);

  const { parseBribeDepositResult, proposalToGauge, processedBribeIds } = awsData;
  const { gaugesToVoteProportion } = wrappedGaugesToVoteProportion;

  const { bribeIds, bribeIdToGaugeMap, bribeIdToInfoMap } = await createMerkleTree_parseBribeIds(
    parseBribeDepositResult,
    proposalToGauge
  );

  const { newProcessedBribeIds, bribeIdMerkleTrees, merkleLeafPutRequests } = createMerkleTree_generateTrees(
    bribeIds,
    bribeIdToGaugeMap,
    bribeIdToInfoMap,
    processedBribeIds,
    gaugesToVoteProportion
  );

  await createMerkleTree_saveToAWS(newProcessedBribeIds, bribeIdMerkleTrees, merkleLeafPutRequests);
};
