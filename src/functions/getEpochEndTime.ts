import { Contract } from 'ethers';
import { contracts } from '../network';

export const getEpochEndTime = async function getEpochEndTime(): Promise<number> {
  // Query SetProposal events, find latest deadline.
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const setProposalEvents = await balancerBribe.queryFilter(balancerBribe.filters.SetProposal());
  const deadlines = setProposalEvents.map((event) => parseInt(String(event?.args?.deadline), 10));
  deadlines.sort();
  return deadlines[deadlines.length - 1];
};
