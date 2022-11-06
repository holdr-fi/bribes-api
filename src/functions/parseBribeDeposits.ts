import { BigNumber, Contract } from 'ethers';
import { contracts } from '../network';
import { mapToObj } from '../utils';
import { ParseBribeDepositsData } from '../types';
import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });

// Gets all bribeId and rewardId from previous DepositBribe events.
export const parseBribeDeposits = async function parseBribeDeposits(): Promise<void> {
  const savedData = await _parseBribeDeposits();

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'ParseBribeDepositResults',
      Body: JSON.stringify(savedData),
    })
    .promise();
};

export const _parseBribeDeposits = async function _parseBribeDeposits(): Promise<ParseBribeDepositsData> {
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const eventFilter = balancerBribe.filters.DepositBribe();
  const events = await balancerBribe.queryFilter(eventFilter);

  // Refactor question - should we store in DB solution, rather than in S3 files?

  // Set of all reward IDs.
  const rewardIdSet: Set<string | unknown> = new Set();
  // Proposal ID => Bribe ID
  const proposalToBribeIds: Map<string, Set<string>> = new Map();
  // Bribe ID => Total bribe amount
  const bribeIdToAmounts: Map<string, BigNumber> = new Map();
  // Bribe ID => Token address
  const bribeIdToToken: Map<string, string> = new Map();

  events.forEach((event) => {
    const proposal = event?.args?.proposal;
    const token = event?.args?.token;
    const amount = event?.args?.amount;
    const bribeIdentifier: string = event?.args?.bribeIdentifier;
    const rewardIdentifier: string = event?.args?.rewardIdentifier;

    rewardIdSet.add(rewardIdentifier);
    bribeIdToToken.set(bribeIdentifier, token);

    if (typeof proposalToBribeIds.get(proposal) === 'undefined') {
      proposalToBribeIds.set(proposal, new Set([bribeIdentifier]));
    } else {
      proposalToBribeIds.get(proposal)?.add(bribeIdentifier);
    }

    if (typeof bribeIdToAmounts.get(bribeIdentifier) === 'undefined') {
      bribeIdToAmounts.set(bribeIdentifier, amount);
    } else {
      const oldAmount = bribeIdToAmounts.get(bribeIdentifier);
      if (typeof oldAmount !== 'undefined') {
        bribeIdToAmounts.set(bribeIdentifier, oldAmount.add(amount));
      }
    }
  });

  const savedData = {
    timestamp: Math.floor(Date.now() / 1000),
    bribeIds: Array.from(bribeIdToAmounts.keys()),
    rewardIds: Array.from(rewardIdSet),
    proposalIds: Array.from(proposalToBribeIds.keys()),
    proposalToBribeIds: mapToObj(proposalToBribeIds),
    bribeIdToToken: mapToObj(bribeIdToToken),
    bribeIdToAmounts: mapToObj(bribeIdToAmounts),
  };

  return savedData;
};
