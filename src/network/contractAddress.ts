import { ContractAddressListCollection, ContractAddressList } from './types';

const mainnetContractAddressList: ContractAddressList = {
  BribeVault: '0x9ddb2da7dd76612e0df237b89af2cf4413733212',
  RewardDistributor: '0x0b139682d5c9df3e735063f46fb98c689540cf3a',
  BalancerBribe: '0x7Cdf753b45AB0729bcFe33DC12401E55d28308A9',
  VotingEscrow: '0xC128a9954e6c874eA3d62ce62B468bA073093F25',
  GaugeController: '0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD',
};

const mumbaiContractAddressList: ContractAddressList = {
  BribeVault: '0xAD6bba392F770f8628f98636B23CA12B05Bd5BB5',
  RewardDistributor: '0xE0128e57F33F42C69F32FCaf37E323fE4865e00D',
  BalancerBribe: '0x6E97a32F28C6A0336f7aCdCdC72Eac5e5320D15e',
  VotingEscrow: '0xC3Ba2291E0A3C87A83eC9A259BaBA3779738A47d',
  GaugeController: '0xe9fBFdDFfa5152Bbe4eB5e38e4fA1aD8b5c893Dd',
};

export const contractAddressListCollection: ContractAddressListCollection = {
  [1]: mainnetContractAddressList,
  [80001]: mumbaiContractAddressList,
};
