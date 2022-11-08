import { _getGaugeToProposalMap } from '../src/functions/getGaugeToProposalMap';
import { _parseBribeDeposits } from '../src/functions/parseBribeDeposits';
import { _getDepositBribeParameters, _getFreshBribeIds, _merkleTreesToParameters } from '../src/functions';
import {
  createMerkleTree_parseBribeIds,
  createMerkleTree_parseVoteForGaugeEvents,
  createMerkleTree_generateTrees,
} from '../src/functions/subfunctions';

import processedBribeIds from './mocks/mockProcessedBribeIds.json';
import { ParseBribeIdsData, ParseBribeDepositsData, MerkleTreeCollection, MerkleLeafPutRequest } from '../src/types';
import { BigNumber } from 'ethers';

// Return values that we want to persist across this global scope.
let getGaugeToProposalMapData: {
  gaugeToProposal: { [gaugeAddress: string]: string };
  proposalToGauge: { [proposal: string]: string };
};
let parseBribeDepositsData: ParseBribeDepositsData;
let parseBribeIdsData: ParseBribeIdsData;
let parseVoteForGaugeData: {
  gaugesToVoteProportion: Map<string, Map<string, BigNumber>>;
};
let createMerkleTreeData: {
  newProcessedBribeIds: string[];
  bribeIdMerkleTrees: MerkleTreeCollection;
  merkleLeafPutRequests: MerkleLeafPutRequest[];
};

// TO-DO: To make this a true unit test suite, we need to mock the Ethereum events
describe('createMerkleTree pipeline', async () => {
  describe('#_getGaugeToProposalMap()', async () => {
    it('', async () => {
      getGaugeToProposalMapData = await _getGaugeToProposalMap();
      // console.log(getGaugeToProposalMapData);
      // This is an anti-pattern according to Mock docs.
      // However this function is very dependent on Solidity event, so better to have a test that console.logs the output for local debugging, than not have a unit test.
      // expect(getGaugeToProposalMapData).to.not.be.null;
      return;
    }).timeout(60000);
  });

  describe('#_parseBribeDeposits()', async () => {
    it('', async () => {
      // parseBribeDepositsData = await _parseBribeDeposits();
      // console.log(parseBribeDepositsData);
      return;
    }).timeout(60000);
  });

  describe('#createMerkleTree_parseBribeIds()', async () => {
    it('', async () => {
      // parseBribeIdsData = await createMerkleTree_parseBribeIds(
      //   parseBribeDepositsData,
      //   getGaugeToProposalMapData.proposalToGauge
      // );
      // console.log(parseBribeIdsData);
    }).timeout(60000);
  });

  describe('#createMerkleTree_parseVoteForGaugeEvents()', async () => {
    it('', async () => {
      // parseVoteForGaugeData = await createMerkleTree_parseVoteForGaugeEvents();
      // console.log(parseVoteForGaugeData.gaugesToVoteProportion.get('0x24644bB717F708aE3735e64181DA71ef0829c565'));
    }).timeout(60000);
  });

  describe('#createMerkleTree_generateTrees()', async () => {
    it('', async () => {
      // createMerkleTreeData = createMerkleTree_generateTrees(
      //   parseBribeIdsData.bribeIds,
      //   parseBribeIdsData.bribeIdToGaugeMap,
      //   parseBribeIdsData.bribeIdToInfoMap,
      //   processedBribeIds,
      //   parseVoteForGaugeData.gaugesToVoteProportion
      // );
      // console.log(createMerkleTreeData);
    }).timeout(60000);
  });
});

describe('APIs dependent on pipeline', async () => {
  describe('#getDepositBribeParameters()', async () => {
    it('', async () => {
      const data = await _getDepositBribeParameters(getGaugeToProposalMapData.proposalToGauge);
      console.log(data);
      return;
    }).timeout(10000);
  });

  describe('#_merkleTreesToParameters()', async () => {
    it('', async () => {
      // const freshBribeIds = await _getFreshBribeIds(processedBribeIds);
      // console.log('freshBribeIds: ', freshBribeIds);
      // const merkleTrees = freshBribeIds.map((bribeId) => createMerkleTreeData.bribeIdMerkleTrees[bribeId]);
      // const parameters = _merkleTreesToParameters(merkleTrees);
      // console.log(parameters);
      return;
    }).timeout(10000);
  });
});
