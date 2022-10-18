import { WEEK } from '../constants';

export const getEpochStartTimestamp = function getEpochStartTimestamp(timestamp: number): number {
  return Math.floor(timestamp / WEEK) * WEEK;
};
