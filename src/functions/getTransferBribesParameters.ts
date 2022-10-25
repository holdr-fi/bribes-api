import { Contract } from 'ethers';
import { contracts } from '../network';

export const getTransferBribesParameters = async function getTransferBribesParameters(): Promise<string[]> {
  // Get stale rewardIds from TransferBribe events from BribeVault.sol
  const bribeVault: Contract = contracts['BribeVault'];
  const balancerBribe: Contract = contracts['BalancerBribe'];

  const [transferBribeEvents, depositBribeEvents] = await Promise.all([
    bribeVault.queryFilter(bribeVault.filters.TransferBribe()),
    balancerBribe.queryFilter(balancerBribe.filters.DepositBribe()),
  ]);

  const staleRewardIds = transferBribeEvents.map((event) => event?.args?.rewardIdentifier);
  const allRewardIds = depositBribeEvents.map((event) => event?.args?.rewardIdentifier);
  const proposals = depositBribeEvents.map((event) => event?.args?.proposal);

  const proposalDeadlines = (
    await Promise.all(proposals.map((proposal) => balancerBribe.proposalDeadlines(proposal)))
  ).map((deadline) => parseInt(String(deadline), 10));

  const validRewardIdentifers = allRewardIds
    .filter((rewardId) => !staleRewardIds.includes(rewardId))
    // Filter out rewardIds associated with proposals that are not yet past their deadline.
    .filter((rewardId, index) => proposalDeadlines[index] > Math.floor(Date.now() / 1000));

  return validRewardIdentifers;
};
