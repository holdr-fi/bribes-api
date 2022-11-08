import axios from 'axios';
import { CHAIN_ID } from '../constants';

export const getCoingeckoPrice = async function getCoingeckoPrice(tokenAddresses: string[]): Promise<PriceData> {
  let platformId = '';
  switch (CHAIN_ID) {
    case '80001':
      return tokenAddresses.reduce((runningPriceData, tokenAddr) => {
        runningPriceData[tokenAddr] = 0;
        return runningPriceData;
      }, {} as PriceData);
    case '1':
      platformId = 'ethereum';
      break;
    case '1313161554':
      platformId = 'aurora';
      break;
    default:
      return tokenAddresses.reduce((runningPriceData, tokenAddr) => {
        runningPriceData[tokenAddr] = 0;
        return runningPriceData;
      }, {} as PriceData);
  }

  // Build `contract_addresses` argument for API request
  let contractsStr = '';
  for (let i = 0; i < tokenAddresses.length; i++) {
    contractsStr += tokenAddresses[i];
    if (i < tokenAddresses.length - 1) {
      contractsStr += ',';
    }
  }

  const { data: coingeckoData } = (await axios.get(
    `https://api.coingecko.com/api/v3/simple/token_price/${platformId}`,
    {
      params: {
        contract_addresses: contractsStr,
        vs_currencies: 'usd',
      },
    }
  )) as { data: CoingeckoTokenPriceResponse };

  // If Coingecko response includes price for provided token address, provide it. Otherwise, return 0.
  return tokenAddresses.reduce((runningPriceData, tokenAddr) => {
    runningPriceData[tokenAddr] = Object.prototype.hasOwnProperty.call(coingeckoData, tokenAddr.toLowerCase())
      ? coingeckoData[tokenAddr.toLowerCase()]['usd']
      : 0;
    return runningPriceData;
  }, {} as PriceData);
};

type CoingeckoTokenPriceResponse = {
  [tokenAddress: string]: {
    [currency: string]: number;
  };
};

type PriceData = {
  [tokenAddress: string]: number;
};
