import { Contract } from 'ethers';
import { contracts } from '../../network';
import { Event, BigNumber, constants } from 'ethers';
import { sortEventsByOrder } from '../../utils';
import { ZERO, ONE, TEN_THOUSAND } from '../../constants';
const { MaxUint256 } = constants;

export const createMerkleTree_parseVoteForGaugeEvents = async function createMerkleTree_parseVoteForGaugeEvents(
  VoteForGaugeEvents: Event[]
): Promise<{
  gaugesToVoteProportion: Map<string, Map<string, BigNumber>>;
}> {
  sortEventsByOrder(VoteForGaugeEvents);
  // UNSURE - We are mutating these two Map structure rather than creating new Map structures. It is probably easier to understand the code if we create new Map structures each time we want to change what the map value represents, rather than mutating the same Map structure multiple times throughout this function.
  const voterToGauges: Map<string, Map<string, BigNumber>> = new Map();
  const gaugesToVotes: Map<string, Map<string, BigNumber>> = new Map();

  VoteForGaugeEvents.forEach((event) => {
    const user = event?.args?.user;
    const gauge_addr = event?.args?.gauge_addr;
    const weight = event?.args?.weight;

    // Outer mapping key doesn't exist
    if (!voterToGauges.has(user)) {
      voterToGauges.set(user, new Map([[gauge_addr, weight]]));
      // Inner mapping key doesn't exist || Outer and inner mapping key exists
    } else {
      const currentMap = voterToGauges.get(user) || new Map();
      currentMap.set(gauge_addr, weight);
    }

    if (!gaugesToVotes.has(gauge_addr)) {
      gaugesToVotes.set(gauge_addr, new Map([[user, weight]]));
    } else {
      const currentMap = gaugesToVotes.get(gauge_addr) || new Map();
      currentMap.set(user, weight);
    }
  });

  // Clean gaugesToVotes and voterToGauges of all zero values

  gaugesToVotes.forEach((innerMap) => {
    innerMap.forEach((gaugeWeight, user) => {
      if (gaugeWeight.eq(ZERO)) {
        innerMap.delete(user);
      }
    });
  });

  voterToGauges.forEach((innerMap) => {
    innerMap.forEach((gaugeWeight, gauge) => {
      if (gaugeWeight.eq(ZERO)) {
        innerMap.delete(gauge);
      }
    });
  });

  // Validation of voterToGauges mapping - the sum of each voters' votes should not exceed 10000

  voterToGauges.forEach((innerMap, voter) => {
    // const doesn't seem to work when values are passed by reference, only when passed by value. So here Rust would say you were using a mutable reference, whereas JS doesn't care.
    const totalVoteWeight = ZERO;
    // Borrowing from Rust syntax where '_' means a variable we don't want to use.
    innerMap.forEach((gaugeWeight, _) => {
      totalVoteWeight.add(gaugeWeight);
    });
    if (totalVoteWeight.gt(TEN_THOUSAND)) {
      throw new Error(`totalGaugeWeight > 10000 for ${voter}`);
    }
  });

  // In each mapping, replace voteWeight values with `voteWeight * individualVotePower = allocatedVotePower`, with individualVotePower == VotingEscrow.balanceOf(...)
  const votingEscrow: Contract = contracts['VotingEscrow'];
  const promises: Promise<BigNumber>[] = [];
  voterToGauges.forEach((_, voter) => {
    promises.push(votingEscrow['balanceOf(address)'](voter));
  });
  const voterVotePowers = await Promise.all(promises);

  voterToGauges.forEach((gaugeToWeightInnerMap, voter) => {
    const votePower = voterVotePowers.shift() || MaxUint256;
    // Can't coerce undefined to ZERO, because some votePower values are ZERO.
    // TODO: We are assuming direct mapping of votingEscrow.balanceOf() and bribe reward, is this neccesarily correct? Does veBAL delegation affect our implementation or should we ignore it for simplicity?
    if (votePower.eq(MaxUint256)) {
      throw new Error('voterVotePowers.length != voterToGauges.keys().length');
    }
    gaugeToWeightInnerMap.forEach((voteWeight, gauge) => {
      const voterToWeightInnerMap = gaugesToVotes.get(gauge) || new Map();
      if (voterToWeightInnerMap.size === 0) {
        throw new Error(`Reverse map entry does not exist for voter: ${voter}, gauge: ${gauge}`);
      }
      if (!voterToWeightInnerMap.get(voter).eq(gaugeToWeightInnerMap.get(gauge))) {
        throw new Error(`Reverse map entry is not equivalent for voter: ${voter}, gauge: ${gauge}`);
      }
      gaugeToWeightInnerMap.set(gauge, voteWeight.mul(votePower).div(10000));
      voterToWeightInnerMap.set(voter, voteWeight.mul(votePower).div(10000));
    });
  });

  // Clean gaugesToVotes and voterToGauges of all zero values (again, because we are now considering votingEscrow.balanceOf() == 0 cases, whereas before we were just considering voteWeight == 0 cases).

  gaugesToVotes.forEach((innerMap) => {
    innerMap.forEach((votePower, user) => {
      if (votePower.eq(ZERO)) {
        innerMap.delete(user);
      }
    });
  });

  voterToGauges.forEach((innerMap) => {
    innerMap.forEach((votePower, gauge) => {
      if (votePower.eq(ZERO)) {
        innerMap.delete(gauge);
      }
    });
  });

  // In gaugesToVotes, replace `allocatedVotePower` values with `Proportion of allocatedVotePower` to 18 decimal places.
  gaugesToVotes.forEach((voterToWeightInnerMap, gauge) => {
    // Find sum of `allocatedVotePower` for voterToWeightInnerMap
    let sumVotePower = ZERO;

    voterToWeightInnerMap.forEach((votePower, _) => {
      sumVotePower = sumVotePower.add(votePower);
    });

    // Replace each `allocatedVotePower` value for `proportion`
    voterToWeightInnerMap.forEach((votePower, voter) => {
      voterToWeightInnerMap.set(voter, votePower.mul(ONE).div(sumVotePower));
    });
  });

  return {
    gaugesToVoteProportion: gaugesToVotes,
  };
};
