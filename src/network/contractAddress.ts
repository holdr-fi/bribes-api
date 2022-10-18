import { ContractAddressListCollection, ContractAddressList } from './types';

const mainnetContractAddressList: ContractAddressList = {
  BribeVault: '0x9ddb2da7dd76612e0df237b89af2cf4413733212',
  RewardDistributor: '0x0b139682d5c9df3e735063f46fb98c689540cf3a',
  BalancerBribe: '0x7Cdf753b45AB0729bcFe33DC12401E55d28308A9',
};

export const contractAddressListCollection: ContractAddressListCollection = {
  [1]: mainnetContractAddressList,
};
