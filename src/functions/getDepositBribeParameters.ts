import { Contract } from 'ethers';
import { contracts } from '../network';
import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../constants';
const s3 = new AWS.S3({ region: 'us-west-2' });

// Get collection of active proposals (and corresponding gauges), and whitelisted tokens.
export const getDepositBribeParameters = async function getDepositBribeParameters(): Promise<{
  proposalsAndGauges: ProposalAndGauge[];
  tokens: string[];
}> {
  const wrappedProposalToGauge = await s3
    .getObject({
      Bucket: BUCKET_NAME,
      Key: 'ProposalToGauge',
    })
    .promise();

  const proposalToGauge: { [proposal: string]: string } = JSON.parse(String(wrappedProposalToGauge?.Body));

  return _getDepositBribeParameters(proposalToGauge);
};

export const _getDepositBribeParameters = async function _getDepositBribeParameters(proposalToGauge: {
  [proposal: string]: string;
}): Promise<{
  proposalsAndGauges: ProposalAndGauge[];
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

  const proposalsAndGauges = proposals.map((proposal) => {
    return {
      proposal: proposal,
      gauge: proposalToGauge[proposal],
    };
  });

  return {
    proposalsAndGauges: proposalsAndGauges,
    tokens: whitelistedtokens,
  };
};

type ProposalAndGauge = {
  proposal: string;
  gauge: string;
};
