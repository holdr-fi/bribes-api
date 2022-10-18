import { getCurrentTime } from '.';
import { provider } from '../network';
import { WEEK } from '../constants';

export const getBlockCountForWeek = async function getBlockCountForWeek(): Promise<number> {
  // Get average time-per-block, from most recent 1000 block sample.
  // If we didn't insist on using the most recent 1000 block sample, and use a fixed 1000-block sample, we could eliminate a HTTP request-response cycle here.
  const { timestamp, blockNumber } = await getCurrentTime(provider);
  const { timestamp: olderBlockTimestamp } = await provider.getBlock(blockNumber - 1000);
  const averageBlockTime = (timestamp - olderBlockTimestamp) / 1000;
  return Math.floor(WEEK / averageBlockTime);
};
