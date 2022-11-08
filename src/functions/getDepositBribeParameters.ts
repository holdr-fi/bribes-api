import { Contract, BigNumber } from 'ethers';
import { contracts, provider } from '../network';
import AWS from 'aws-sdk';
import { BUCKET_NAME, TEN_BASE } from '../constants';
import { arraySlicer, getCoingeckoPrice } from '../utils';
import { ProposalInfo, TokenInfo } from '../types';
import GAUGE_ABI from '../network/abis/Gauge.json';
import ERC20_ABI from '../network/abis/ERC20.json';
const s3 = new AWS.S3({ region: 'us-west-2' });

// Get collection of active proposals (and corresponding gauges), and whitelisted tokens.
export const getDepositBribeParameters = async function getDepositBribeParameters(): Promise<{
  proposalInfo: ProposalInfo[];
  tokens: string[];
}> {
  const [wrappedProposalToGauge, wrappedProcessedBribeIds] = await Promise.all([
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ProposalToGauge',
      })
      .promise(),
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ProcessedBribeIds',
      })
      .promise(),
  ]);

  const proposalToGauge: { [proposal: string]: string } = JSON.parse(String(wrappedProposalToGauge?.Body));
  const processedBribeIds: string[] = Array.from(JSON.parse(String(wrappedProcessedBribeIds?.Body)));

  return _getDepositBribeParameters(proposalToGauge, processedBribeIds);
};

export const _getDepositBribeParameters = async function _getDepositBribeParameters(
  proposalToGauge: { [proposal: string]: string },
  processedBribeIds: string[]
): Promise<{
  proposalInfo: ProposalInfo[];
  tokens: string[];
}> {
  // Query SetProposal events, get all proposals for which deadline has not expired.
  const balancerBribe: Contract = contracts['BalancerBribe'];

  const [whitelistedtokens, setProposalEvents] = await Promise.all([
    balancerBribe.getWhitelistedTokens(),
    balancerBribe.queryFilter(balancerBribe.filters.SetProposal()),
  ]);

  const unfilteredProposalEvents: { proposal: string; deadline: number }[] = setProposalEvents.map((event) => {
    return { proposal: event?.args?.proposal, deadline: parseInt(String(event?.args?.deadline), 10) };
  });

  const proposals = unfilteredProposalEvents
    .filter((proposalEvent) => proposalEvent.deadline > Math.floor(Date.now() / 1000))
    .map((proposalEvent) => proposalEvent.proposal);

  // From gauge address, query i.) gauge name, ii.) associated pool, iii.) veBAL balance, iv.) All deposit bribe events
  const poolPromises = proposals.map((proposal) => {
    const gauge: Contract = new Contract(proposalToGauge[proposal], GAUGE_ABI, provider);
    return gauge.lp_token();
  });

  const gaugeNamePromises = proposals.map((proposal) => {
    const gauge: Contract = new Contract(proposalToGauge[proposal], GAUGE_ABI, provider);
    return gauge.name();
  });

  const votesForGaugePromises = proposals.map((proposal) => {
    return contracts['GaugeController'].get_gauge_weight(proposalToGauge[proposal]);
  });

  const bribesForGaugePromises = proposals.map((proposal) => {
    return contracts['BalancerBribe'].queryFilter(
      contracts['BalancerBribe'].filters.DepositBribe(proposal, null, null)
    );
  });

  const gaugeInfo = await Promise.all([
    ...poolPromises,
    ...gaugeNamePromises,
    ...votesForGaugePromises,
    ...bribesForGaugePromises,
  ]);

  const [pools, gaugeNames, votes, bribeEventsForGauge] = arraySlicer(gaugeInfo, proposals.length);

  // bribesForGauge contains all previous DepositForBribe events for this gauge. Isolate the {token, amount, bribeIdentifier} parameters from each event, then filter processedBribeIds.
  const currentBribesForGauge: { bribeIdentifier: string; token: string; amount: BigNumber }[][] =
    bribeEventsForGauge.map((bribeEventsForSingleGauge) =>
      bribeEventsForSingleGauge
        .map((bribeEvent) => {
          return {
            bribeIdentifier: bribeEvent?.args?.bribeIdentifier,
            token: bribeEvent?.args?.token,
            amount: bribeEvent?.args?.amount,
          };
        })
        .filter((bribeEventArgs) => !processedBribeIds.includes(bribeEventArgs?.bribeIdentifier))
    );

  // Get set of bribe tokens used in current bribes.
  const bribeTokens: Set<string> = currentBribesForGauge.reduce(
    (outerRunningBribeTokenSet, bribeEventsForSingleGauge) => {
      return bribeEventsForSingleGauge.reduce((innerRunningBribeTokenSet, bribeEvent) => {
        return innerRunningBribeTokenSet.add(bribeEvent.token);
      }, outerRunningBribeTokenSet);
    },
    new Set<string>()
  );

  // Get price for each bribe token
  const bribeTokenPrices = await getCoingeckoPrice(Array.from(bribeTokens));

  // Get decimals for each bribeToken
  const decimals: number[] = await Promise.all(
    Object.keys(bribeTokenPrices).map((bribeToken) => {
      const token = new Contract(bribeToken, ERC20_ABI, provider);
      return token.decimals();
    })
  );

  // Collect price and decimal information together for each bribe token
  const bribeTokenInfo: TokenInfo = Object.keys(bribeTokenPrices).reduce((runningTokenInfo, bribeToken, index) => {
    runningTokenInfo[bribeToken] = {
      decimals: decimals[index],
      price: bribeTokenPrices[bribeToken],
    };
    return runningTokenInfo;
  }, {});

  // Compute USD value of each bribe
  const currentBribes = currentBribesForGauge.map((currentBribesForSingleGauge) =>
    currentBribesForSingleGauge.map((currentBribe) => {
      return {
        token: currentBribe.token,
        amount: currentBribe.amount,
        usdValue:
          parseInt(String(currentBribe.amount.div(TEN_BASE.pow(bribeTokenInfo[currentBribe.token].decimals))), 10) *
          bribeTokenInfo[currentBribe.token].price,
      };
    })
  );

  const proposalInfo: ProposalInfo[] = proposals.map((proposal, index) => {
    const totalUSDValue = currentBribes[index].reduce((runningSum, bribeInfo) => {
      return runningSum + bribeInfo.usdValue;
    }, 0);

    return {
      proposal: proposal,
      gauge: proposalToGauge[proposal],
      pool: pools[index],
      gaugeName: gaugeNames[index],
      votes: String(votes[index]),
      currentBribes: currentBribes[index],
      totalUSDValue: totalUSDValue,
      USDValuePerVote: totalUSDValue / parseInt(String(votes[index]), 10),
    };
  });

  return {
    proposalInfo: proposalInfo,
    tokens: whitelistedtokens,
  };
};
