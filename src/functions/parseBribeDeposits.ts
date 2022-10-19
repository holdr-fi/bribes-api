import { BigNumber, Contract } from 'ethers';
import { contracts } from '../network';
import { getBlockCountForWeek, mapToObj } from '../utils';
import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });

// Gets all bribeId and rewardId from DepositBribe events in last week
export const parseBribeDeposits = async function parseBribeDeposits(): Promise<void> {
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const eventFilter = balancerBribe.filters.DepositBribe();
  const numBlocksToSearch = await getBlockCountForWeek();
  const events = await balancerBribe.queryFilter(eventFilter, -numBlocksToSearch);

  // Is this a clumsy pattern parsing the events object to get data like this?
  // Could we store events into a single format, and perhaps make SQL queries to get the data we are seeking?
  // const bribeIdSet: Set<string | unknown> = new Set();
  const rewardIdSet: Set<string | unknown> = new Set();
  const proposalToBribeIds: Map<string, Set<string>> = new Map();
  const bribeIdToAmounts: Map<string, BigNumber> = new Map();
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
      // Duplicate check for undefined type, but TS doesn't let me write the next line otherwise.
      if (typeof oldAmount !== 'undefined') {
        bribeIdToAmounts.set(bribeIdentifier, oldAmount.add(amount));
      }
    }
  });

  const savedData = {
    timestamp: Math.floor(Date.now() / 1000),
    // TODO: Filter out bribeIds if previously processed
    bribeIds: Array.from(bribeIdToAmounts.keys()),
    rewardIds: Array.from(rewardIdSet),
    proposalIds: Array.from(proposalToBribeIds.keys()),
    proposalToBribeIds: mapToObj(proposalToBribeIds),
    bribeIdToToken: mapToObj(bribeIdToToken),
    bribeIdToAmounts: mapToObj(bribeIdToAmounts),
  };

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'ParseBribeDepositResults',
      Body: JSON.stringify(savedData),
    })
    .promise();
};

// let usedBribeIds;

// try {
//   usedBribeIds = await s3
//     .getObject({
//       Bucket: BUCKET_NAME,
//       Key: 'UsedBribeIDs',
//     })
//     .promise();
// } catch (e) {
//   usedBribeIds = undefined;
//   console.error(e);
// }
