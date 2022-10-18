import BalancerBribeABI from './abis/BalancerBribe.json';
import BribeVaultABI from './abis/BribeVault.json';
import RewardDistributorABI from './abis/RewardDistributor.json';
import GaugeControllerABI from './abis/GaugeController.json';
import VotingEscrowABI from './abis/VotingEscrow.json';
import { contractAddressListCollection } from './contractAddress';
import { ContractAddressList } from './types';
import { provider } from './provider';
import { Contract } from 'ethers';
import { CHAIN_ID } from '../constants';

const contractList: ContractAddressList = contractAddressListCollection[CHAIN_ID];

const getABI = function getABI(contractName: string) {
  switch (contractName) {
    case 'BalancerBribe':
      return BalancerBribeABI;
    case 'BribeVault':
      return BribeVaultABI;
    case 'RewardDistributor':
      return RewardDistributorABI;
    case 'GaugeController':
      return GaugeControllerABI;
    case 'VotingEscrow':
      return VotingEscrowABI;
    default:
      throw new Error(`Unable to find ${contractName}ABI`);
  }
};

export const contracts = Object.keys(contractList).reduce((contractsObject, contractName) => {
  const address = contractList[contractName];
  const abi = getABI(contractName);
  contractsObject[contractName] = new Contract(address, abi, provider);
  return contractsObject;
}, {});
