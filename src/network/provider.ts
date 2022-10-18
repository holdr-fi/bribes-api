import { providers } from 'ethers';

let RPC_URL: string;

switch (process.env.CHAIN_ID) {
  case '1':
    RPC_URL = process.env.MAINNET_URL || '';
    break;
  default:
    RPC_URL = '';
}

export const provider = new providers.JsonRpcProvider(RPC_URL);
