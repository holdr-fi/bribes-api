import { Contract, BigNumber } from 'ethers';
import { contracts } from '../../network';
import { ParseBribeDepositsData, ParseBribeIdsData } from '../../types';

// CONSIDER - Should this be part of createMerkleTree function, or separate with output saved to AWS like getGaugeToProposalMap?
// ALSO CONSIDER - Could we be saving this data in a database, rather than to S3 or not saving the data (i.e. recomputing everytime)?
export const createMerkleTree_parseBribeIds = async function createMerkleTree_parseBribeIds(
  parseBribeDepositResult: ParseBribeDepositsData,
  proposalToGauge: { [proposal: string]: string }
): Promise<ParseBribeIdsData> {
  const bribeVault: Contract = contracts['BribeVault'];
  // getBribe(bytes32 bribeIdentifier) => (address token, uint256 amount)
  const bribeInfo: { token: string; amount: BigNumber }[] = await Promise.all(
    parseBribeDepositResult.bribeIds.map((bribeId) => bribeVault.getBribe(bribeId))
  );

  // bribeId => proposal
  const bribeIdToProposalMap: Map<string, string> = new Map();

  // Change type from { proposal: bribeIds[] } to 'proposal => bribeId'
  Object.keys(parseBribeDepositResult.proposalToBribeIds).forEach((proposal) => {
    const bribeIds: string[] = parseBribeDepositResult.proposalToBribeIds[proposal];
    bribeIds.forEach((bribeId) => {
      bribeIdToProposalMap.set(bribeId, proposal);
    });
  });

  // bribeId => gauge
  const bribeIdToGaugeMap: Map<string, string> = new Map();

  bribeIdToProposalMap.forEach((proposal, bribeId) => {
    const gauge = proposalToGauge[proposal];
    bribeIdToGaugeMap.set(bribeId, gauge);
  });

  // Create bribeIdToInfoMap
  const bribeIdToInfoMap: Map<string, { token: string; amount: BigNumber }> = new Map();

  // bribeInfo was built from parseBribeDepositResult.bribeIds.map, so should in the same order.
  parseBribeDepositResult.bribeIds.forEach((bribeId, index) => {
    const { token, amount } = bribeInfo[index] || { token: '', amount: BigNumber.from('0') };
    if (token === '') {
      throw new Error('createMerkleTree_parseBribeIds - undefined bribeInfo element');
    }
    bribeIdToInfoMap.set(bribeId, { token: token, amount: amount });
  });

  return {
    bribeIds: parseBribeDepositResult.bribeIds,
    bribeIdToGaugeMap: bribeIdToGaugeMap,
    bribeIdToInfoMap: bribeIdToInfoMap,
  };
};
