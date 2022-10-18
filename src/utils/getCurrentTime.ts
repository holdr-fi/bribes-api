import { providers } from 'ethers';
import { BlockTimeParameters } from '.';

export const getCurrentTime = async function getCurrentTime(
  provider: providers.Provider
): Promise<BlockTimeParameters> {
  const latestBlock = await provider.getBlock('latest');

  return {
    timestamp: latestBlock.timestamp,
    blockNumber: latestBlock.number,
  };
};
