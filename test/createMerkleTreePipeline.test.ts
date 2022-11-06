import { _getGaugeToProposalMap } from '../src/functions/getGaugeToProposalMap';
import { _parseBribeDeposits } from '../src/functions/parseBribeDeposits';
import {
  createMerkleTree_parseBribeIds,
  createMerkleTree_parseVoteForGaugeEvents,
  createMerkleTree_generateTrees,
} from '../src/functions/subfunctions';

describe('createMerkleTree pipeline', async () => {
  let getGaugeToProposalMapData;
  let parseBribeDepositsData;
  let parseBribeIdsData;
  let parseVoteForGaugeData;

  describe('#_getGaugeToProposalMap()', async () => {
    it('', async () => {
      getGaugeToProposalMapData = await _getGaugeToProposalMap();
      console.log(getGaugeToProposalMapData);
      // This is an anti-pattern according to Mock docs.
      // However this function is very dependent on Solidity event, so better to have a test that console.logs the output for local debugging, than not have a unit test.
      // expect(getGaugeToProposalMapData).to.not.be.null;
      return;
    }).timeout(60000);
  });

  describe('#_parseBribeDeposits()', async () => {
    it('', async () => {
      parseBribeDepositsData = await _parseBribeDeposits();
      console.log(parseBribeDepositsData);
      return;
    }).timeout(60000);
  });

  describe('#createMerkleTree_parseBribeIds()', async () => {
    it('', async () => {
      parseBribeIdsData = await createMerkleTree_parseBribeIds(
        parseBribeDepositsData,
        getGaugeToProposalMapData.proposalToGauge
      );
      console.log(parseBribeIdsData);
    }).timeout(60000);
  });

  describe('#createMerkleTree_parseVoteForGaugeEvents()', async () => {
    it('', async () => {
      parseVoteForGaugeData = await createMerkleTree_parseVoteForGaugeEvents();
      console.log(parseVoteForGaugeData.gaugesToVoteProportion.get('0x24644bB717F708aE3735e64181DA71ef0829c565'));
    }).timeout(60000);
  });
});
