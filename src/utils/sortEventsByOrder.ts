import { Event } from 'ethers';

// Return value unneccessary as the array is sorted in-place, so argument and return value will be the same reference.
export const sortEventsByOrder = function sortEventsByOrder(events: Event[]): Event[] {
  events.sort(function (a, b) {
    if (a.blockNumber == b.blockNumber) {
      return a.transactionIndex - b.transactionIndex;
    } else {
      return a.blockNumber - b.blockNumber;
    }
  });

  return events;
};
