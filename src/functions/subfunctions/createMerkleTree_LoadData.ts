import { Contract, Event, BigNumber } from 'ethers';
import { contracts } from '../../network';
import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../../constants';
const s3 = new AWS.S3({ region: 'us-west-2' });

export const createMerkleTree_LoadData = async function createMerkleTree_LoadData(): Promise<{
  bribeIds: string[];
  bribeIdToGaugeMap: Map<string, string>;
  bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }>;
  processedBribeIds: string[];
  voteForGaugeEvents: Event[];
}> {
  const gaugeController: Contract = contracts['GaugeController'];
  const bribeVault: Contract = contracts['BribeVault'];

  const eventFilter = gaugeController.filters.VoteForGauge();
  const [wrappedParseBribeDepositResult, wrappedProposalToGauge, wrappedProcessedBribeIds] = await Promise.all([
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ParseBribeDepositResults',
      })
      .promise(),
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ProposalToGauge',
      })
      .promise(),
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ProcessedBribeIds',
      })
      .promise(),
  ]);

  const parseBribeDepositResult = JSON.parse(String(wrappedParseBribeDepositResult?.Body));
  const proposalToGauge: { [proposal: string]: string } = JSON.parse(String(wrappedProposalToGauge?.Body));
  // UNSURE - WILL THIS PARSING OPERATION FAIL IF ProcessedBribeIds IS NOT AN EMPTY OBJECT
  const processedBribeIds: string[] = Array.from(JSON.parse(String(wrappedProcessedBribeIds?.Body)));

  const [voteForGaugeEvents, ...bribeInfo] = await Promise.all([
    // Thankfully there is <5000 events in the following request at ~Oct 2022. If it expands to closer to 10000, we will need to refactor the code to maintain our own cache of `VoteForGauge` events, rather than querying the entire history in each instance.
    gaugeController.queryFilter(eventFilter),
    ...parseBribeDepositResult.bribeIds.map((bribeId) => bribeVault.getBribe(bribeId)),
  ]);

  // Create bribeIdToGaugeMap - is this basically what a join operation in SQL is lol?
  const bribeIdToProposalMap: Map<string, string> = new Map();

  Object.keys(parseBribeDepositResult.proposalToBribeIds).forEach((proposal, _) => {
    const bribeIds: string[] = parseBribeDepositResult.proposalToBribeIds[proposal];
    bribeIds.forEach((bribeId) => {
      bribeIdToProposalMap.set(bribeId, proposal);
    });
  });

  const bribeIdToGaugeMap: Map<string, string> = new Map();

  bribeIdToProposalMap.forEach((proposal, bribeId) => {
    const gauge = proposalToGauge[proposal];
    bribeIdToGaugeMap.set(bribeId, gauge);
  });

  // Create bribeIdToInfoMap
  const bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }> = new Map();

  parseBribeDepositResult.bribeIds.forEach((bribeId) => {
    const { token, amount } = bribeInfo.shift();
    bribeIdToInfoMap.set(bribeId, { token: token, amount: amount });
  });

  return {
    bribeIds: parseBribeDepositResult.bribeIds,
    bribeIdToGaugeMap: bribeIdToGaugeMap,
    bribeIdToInfoMap: bribeIdToInfoMap,
    processedBribeIds: processedBribeIds,
    voteForGaugeEvents: voteForGaugeEvents,
  };
};
