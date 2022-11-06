import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../../constants';
import { ParseBribeDepositsData } from '../../types';
const s3 = new AWS.S3({ region: 'us-west-2' });

export const createMerkleTree_loadFromAWS = async function createMerkleTree_LoadData(): Promise<{
  parseBribeDepositResult: ParseBribeDepositsData;
  proposalToGauge: { [proposal: string]: string };
  processedBribeIds: string[];
}> {
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

  return {
    parseBribeDepositResult: parseBribeDepositResult,
    proposalToGauge: proposalToGauge,
    processedBribeIds: processedBribeIds,
  };
};
