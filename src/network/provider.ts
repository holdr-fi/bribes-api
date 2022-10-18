import { providers } from 'ethers';
import { CHAIN_ID, MAINNET_URL } from '../constants';

let RPC_URL: string;

switch (CHAIN_ID) {
  case '1':
    RPC_URL = MAINNET_URL;
    break;
  default:
    throw new Error('Invalid CHAIN_ID');
}

export const provider = new providers.JsonRpcProvider(RPC_URL);
