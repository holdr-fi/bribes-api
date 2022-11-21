import { providers } from 'ethers';
import { CHAIN_ID, MAINNET_URL, MUMBAI_URL, AURORA_URL } from '../constants';

let RPC_URL: string;

switch (CHAIN_ID) {
  case '1':
    RPC_URL = MAINNET_URL;
    break;
  case '80001':
    RPC_URL = MUMBAI_URL;
    break;
  case '1313161554':
    RPC_URL = AURORA_URL;
    break;
  default:
    throw new Error('Invalid CHAIN_ID');
}

export const provider = new providers.JsonRpcProvider(RPC_URL);
