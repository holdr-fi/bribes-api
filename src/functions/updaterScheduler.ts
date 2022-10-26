// DEPRECATED

import { Contract } from 'ethers';
import { contracts } from '../network';
import { DAY } from '../constants';
import { getCurrentUnixTimestamp } from '../utils';
import AWS from 'aws-sdk';
const eventbridge = new AWS.EventBridge();

// Runs every 24 hours, checks if need to schedule getGaugeToProposalMap, parseBribeDeposits and createMerkleTree functions to run in the next 24 hours
export const updaterScheduler = async function updaterScheduler(): Promise<void> {
  // Parse all set gauge proposal events
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const events = await balancerBribe.queryFilter(balancerBribe.filters.SetProposal());
  const deadlines = events.map((event) => parseInt(String(event?.args?.deadline), 10));

  // If any deadlines within next 24 hours, use latest deadline as timestamp to trigger `npm run update` functions.
  const deadlinesInNext24Hours = deadlines.filter(
    // eslint-disable-next-line
    (deadline) => deadline >= getCurrentUnixTimestamp() 
    && deadline <= getCurrentUnixTimestamp() + DAY
  );

  if (deadlinesInNext24Hours.length === 0) {
    return;
  }

  deadlinesInNext24Hours.sort();
  const deadline = deadlinesInNext24Hours.pop() as number;
};
