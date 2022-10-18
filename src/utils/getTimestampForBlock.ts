import { BlockTimeParameters } from './';
import { provider } from '../network';

const acceptedErrorInSeconds = 300;

// Modified binary search for block corresponding to desired timestamp, within 5-minutes of accuracy (acceptable for our use-case of finding the starting block of the current epoch).

export const getBlockForTimestamp = async function getBlockForTimestamp(
  desiredTimestamp: number,
  referenceBlock: BlockTimeParameters
): Promise<number> {
  // Get average time-per-block, from 1000 block sample.
  const { timestamp: olderBlockTimestamp } = await provider.getBlock(referenceBlock.blockNumber - 1000);
  const averageBlockTime = (referenceBlock.timestamp - olderBlockTimestamp) / 1000;

  // Find starting interval for binary search.
  const expectedBlockDelta = Math.floor((referenceBlock.timestamp - desiredTimestamp) / averageBlockTime);

  const expectedBlock = referenceBlock.blockNumber - expectedBlockDelta;

  // Starting binary search interval of 512 blocks.
  let lowerBound = expectedBlock - 256;
  let upperBound = expectedBlock + 256;
  let searchBlock = expectedBlock;

  //  eslint-disable-next-line
  while (true) {
    const searchBlockTimestamp = (await provider.getBlock(searchBlock)).timestamp;

    if (Math.abs(searchBlockTimestamp - desiredTimestamp) <= acceptedErrorInSeconds) {
      break;
    }

    if (searchBlockTimestamp > desiredTimestamp) {
      upperBound = searchBlock;
    } else {
      lowerBound = searchBlock;
    }

    searchBlock = Math.floor((lowerBound + upperBound) / 2);
  }

  return searchBlock;
};
