import { Contract, utils } from 'ethers';
import { contracts } from '../network';
import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });
const { solidityKeccak256 } = utils;

// Parse all setGaugeProposals() and setGaugeProposal() calls
// Get gauge => proposalId and proposalId => gauge mappings
export const getGaugeToProposalMap = async function getGaugeToProposalMap(): Promise<void> {
  const { gaugeToProposal, proposalToGauge } = await _getGaugeToProposalMap();

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'GaugeToProposal',
      Body: JSON.stringify(gaugeToProposal),
    })
    .promise();

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'ProposalToGauge',
      Body: JSON.stringify(proposalToGauge),
    })
    .promise();
};

export const _getGaugeToProposalMap = async function _getGaugeToProposalMap(): Promise<{
  gaugeToProposal: { [gaugeAddress: string]: string };
  proposalToGauge: { [proposal: string]: string };
}> {
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const eventFilter = balancerBribe.filters.SetProposal();
  const events = await balancerBribe.queryFilter(eventFilter);
  // Gauge address is in the transaction parameters.
  // Obtain set of gauges from setGaugeProposals() and setGaugeProposal() calls.
  const txArray = await Promise.all(events.map((event) => event.getTransaction()));
  const gaugeSet: Set<string> = new Set();
  txArray.forEach((tx) => {
    // gauges_ property for setGaugeProposals(), which is a string array.
    // gauge property for setGaugeProposal(), which is a string.
    const gaugeArray: string[] =
      balancerBribe.interface.parseTransaction(tx)?.args?.gauges_ ||
      Array.of(balancerBribe.interface.parseTransaction(tx)?.args?.gauge);
    if (typeof gaugeArray !== 'undefined') {
      gaugeArray.forEach((gauge) => gaugeSet.add(gauge));
    }
  });

  // Now we have set of gauges which have had a proposal set.
  const gaugeToProposal: { [gaugeAddress: string]: string } = {};
  const proposalToGauge: { [proposal: string]: string } = {};

  Array.from(gaugeSet).forEach((gauge) => {
    if (gauge === '') {
      return;
    }
    const proposal = solidityKeccak256(['address'], [gauge]);
    gaugeToProposal[gauge] = proposal;
    proposalToGauge[proposal] = gauge;
  });

  return {
    gaugeToProposal: gaugeToProposal,
    proposalToGauge: proposalToGauge,
  };
};
