import { Contract } from 'ethers';
import { contracts } from '../network';

// Get parameters for BribeVault.transferBribes(bytes32[] calldata rewardIdentifiers).
// Admin needs to call this function at end of each epoch, to transfer bribes from BribeVault to RewardDistributor.
export const getTransferBribesParameters = async function getTransferBribesParameters(): Promise<string[]> {
  const bribeVault: Contract = contracts['BribeVault'];
  const balancerBribe: Contract = contracts['BalancerBribe'];

  const [transferBribeEvents, depositBribeEvents] = await Promise.all([
    bribeVault.queryFilter(bribeVault.filters.TransferBribe()),
    balancerBribe.queryFilter(balancerBribe.filters.DepositBribe()),
  ]);

  const preusedRewardIds = transferBribeEvents.map((event) => event?.args?.rewardIdentifier);
  const allRewardIds = depositBribeEvents.map((event) => event?.args?.rewardIdentifier);
  const proposals = depositBribeEvents.map((event) => event?.args?.proposal);

  const proposalDeadlines: number[] = (
    await Promise.all(proposals.map((proposal) => balancerBribe.proposalDeadlines(proposal)))
  ).map((deadline) => parseInt(String(deadline), 10));

  const validRewardIdentifers = allRewardIds
    // Filter out preused rewardIds
    .filter((rewardId) => !preusedRewardIds.includes(rewardId))
    // Filter rewardIds associated with expired proposals
    .filter((rewardId, index) => proposalDeadlines[index] > Math.floor(Date.now() / 1000));

  return validRewardIdentifers;
};
