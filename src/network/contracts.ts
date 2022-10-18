import BalancerBribeABI from './abis/BalancerBribe.json';
import BribeVaultABI from './abis/BribeVault.json';
import RewardDistributorABI from './abis/RewardDistributor.json';
import { contractAddressListCollection } from './contractAddress';
import { ContractAddressList } from './types';
import { provider } from './provider';
import { Contract } from 'ethers';

const contractList: ContractAddressList = contractAddressListCollection[process.env.CHAIN_ID || ''];

const getABI = function getABI(contractName: string) {
  switch (contractName) {
    case 'BalancerBribe':
      return BalancerBribeABI;
    case 'BribeVault':
      return BribeVaultABI;
    case 'RewardDistributor':
      return RewardDistributorABI;
    default:
      return '';
  }
};

export const contracts = Object.keys(contractList).reduce((contractsObject, contractName) => {
  const address = contractList[contractName];
  const lowercaseContractName = contractName.charAt(0).toLowerCase() + contractName.slice(1);
  const abi = getABI(contractName);
  contractsObject[lowercaseContractName] = new Contract(address, abi, provider);
  return contractsObject;
}, {});
