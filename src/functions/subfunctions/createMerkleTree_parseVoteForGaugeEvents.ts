import { Contract } from 'ethers';
import { contracts } from '../../network';
import { BigNumber, constants } from 'ethers';
import { sortEventsByOrder } from '../../utils';
import { ZERO, ONE, TEN_THOUSAND, ADMIN_ADDRESS } from '../../constants';
const { MaxUint256 } = constants;

export const createMerkleTree_parseVoteForGaugeEvents =
  async function createMerkleTree_parseVoteForGaugeEvents(): Promise<{
    gaugesToVoteProportion: Map<string, Map<string, BigNumber>>;
  }> {
    const gaugeController: Contract = contracts['GaugeController'];
    const eventFilter = gaugeController.filters.VoteForGauge();
    // Thankfully there is <5000 events in the following request at ~Oct 2022. If it expands to closer to 10000, we will need to refactor the code to maintain our own cache of `VoteForGauge` events, rather than querying the entire history in each instance.
    const voteForGaugeEvents = await gaugeController.queryFilter(eventFilter);
    sortEventsByOrder(voteForGaugeEvents);

    // I feel that at some point, it makes more sense to use an in-memory database than use primitive data structures. I'd rather the code be easier to understand with API methods, than wrestle with raw data structures like a pair of nested hashmaps.
    const voterToGauges: Map<string, Map<string, BigNumber>> = new Map();
    const gaugesToVoters: Map<string, Map<string, BigNumber>> = new Map();

    voteForGaugeEvents.forEach((event) => {
      const user = event?.args?.user;
      const gauge_addr = event?.args?.gauge_addr;
      const weight = event?.args?.weight;

      // Outer mapping key doesn't exist
      if (!voterToGauges.has(user)) {
        voterToGauges.set(user, new Map([[gauge_addr, weight]]));
      } else {
        voterToGauges.get(user).set(gauge_addr, weight);
      }

      if (!gaugesToVoters.has(gauge_addr)) {
        gaugesToVoters.set(gauge_addr, new Map([[user, weight]]));
      } else {
        voterToGauges.get(user).set(gauge_addr, weight);
      }
    });

    // Clean voterToGauges and gaugesToVotes of all zero values

    voterToGauges.forEach((innerMap) => {
      innerMap.forEach((gaugeWeight, gauge) => {
        if (gaugeWeight.eq(ZERO)) {
          innerMap.delete(gauge);
        }
      });
    });

    gaugesToVoters.forEach((innerMap) => {
      innerMap.forEach((gaugeWeight, voter) => {
        if (gaugeWeight.eq(ZERO)) {
          innerMap.delete(voter);
        }
      });
    });

    // Validation of voterToGauges mapping - the sum of each voters' votes should not exceed 10000
    voterToGauges.forEach((gaugeToWeightInnerMap, voter) => {
      const totalVoteWeight = Array.from(gaugeToWeightInnerMap.values()).reduce(
        (prevValue, currentValue) => prevValue.add(currentValue),
        ZERO
      );

      if (totalVoteWeight.gt(TEN_THOUSAND)) {
        throw new Error(`totalGaugeWeight > 10000 for ${voter}`);
      }
    });

    // Get current veBAL balance
    const votingEscrow: Contract = contracts['VotingEscrow'];

    const voterVotePowers: BigNumber[] = await Promise.all(
      Array.from(voterToGauges.keys()).map((voter) => votingEscrow['balanceOf(address)'](voter))
    );

    // Replace voteWeight values with `individualVotePower * voteWeight / 10000 = allocatedVotePower`, where individualVotePower == VotingEscrow.balanceOf(...), and voteWeight is weight (max of 10000) placed on this vote.
    Array.from(voterToGauges.keys()).forEach((voter, index) => {
      const votePower = voterVotePowers[index];
      const gaugeToWeightInnerMap = voterToGauges.get(voter);

      gaugeToWeightInnerMap.forEach((voteWeight, gauge) => {
        const voterToWeightInnerMap = gaugesToVoters.get(gauge);
        if (voterToWeightInnerMap.size === 0) {
          throw new Error(`Reverse map entry does not exist for voter: ${voter}, gauge: ${gauge}`);
        }
        if (!voterToWeightInnerMap.get(voter).eq(gaugeToWeightInnerMap.get(gauge))) {
          throw new Error(`Reverse map weight entry is not equivalent for voter: ${voter}, gauge: ${gauge}`);
        }

        // TODO: We are assuming direct mapping of votingEscrow.balanceOf() and bribe reward, is this neccessarily correct? Does veBAL delegation affect our implementation or should we ignore it for simplicity?
        gaugeToWeightInnerMap.set(gauge, votePower.mul(voteWeight).div(10000));
        voterToWeightInnerMap.set(voter, votePower.mul(voteWeight).div(10000));
      });
    });

    // Clean gaugesToVotes and voterToGauges of all zero values (again, because we are now considering votingEscrow.balanceOf() == 0 cases, whereas before we were just considering voteWeight == 0 cases).

    gaugesToVoters.forEach((innerMap) => {
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
    // Iterate through each gauge
    gaugesToVoters.forEach((voterToVotePowerInnerMap, _) => {
      const sumVotePower = Array.from(voterToVotePowerInnerMap.values()).reduce(
        (previousValue, currentValue) => previousValue.add(currentValue),
        ZERO
      );

      // Replace each `allocatedVotePower` value for `proportion`
      voterToVotePowerInnerMap.forEach((votePower, voter) => {
        voterToVotePowerInnerMap.set(voter, ONE.mul(votePower).div(sumVotePower));
      });
    });

    // Here gaugesToVoters is Gauge => Voter => Proportion of allocatedVotePower
    gaugesToVoters.forEach((voterToVotePowerProportionInnerMap, _) => {
      let SUM_PROPORTION = ZERO;
      voterToVotePowerProportionInnerMap.forEach((votePowerProportion, voter) => {
        if (voter !== ADMIN_ADDRESS) {
          SUM_PROPORTION = SUM_PROPORTION.add(votePowerProportion.div(10));
          voterToVotePowerProportionInnerMap.set(voter, votePowerProportion.mul(9).div(10));
        }
      });

      if (voterToVotePowerProportionInnerMap.has(ADMIN_ADDRESS)) {
        voterToVotePowerProportionInnerMap.set(
          ADMIN_ADDRESS,
          voterToVotePowerProportionInnerMap.get(ADMIN_ADDRESS).add(SUM_PROPORTION)
        );
      } else {
        voterToVotePowerProportionInnerMap.set(ADMIN_ADDRESS, SUM_PROPORTION);
      }
    });

    console.log(gaugesToVoters);

    return {
      gaugesToVoteProportion: gaugesToVoters,
    };
  };
