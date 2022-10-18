import { Contract, utils } from 'ethers';
import { contracts } from '../network';
import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });
const { solidityKeccak256 } = utils;

// Obtain gauge => proposalId, and proposalId => gauge maps, by parsing all transactions emitting SetProposal() event.
export const getGaugeToProposalMap = async function getGaugeToProposalMap(): Promise<void> {
  const balancerBribe: Contract = contracts['BalancerBribe'];
  const eventFilter = balancerBribe.filters.SetProposal();
  const events = await balancerBribe.queryFilter(eventFilter);
  const promises = events.map((event) => event.getTransaction());
  const txArray = await Promise.all(promises);
  const gaugeSet = txArray.reduce((runningGaugeSet, tx) => {
    const gaugeArray: string[] = balancerBribe.interface.parseTransaction(tx)?.args?.gauges_;
    if (typeof gaugeArray !== 'undefined') {
      gaugeArray.forEach((gauge) => runningGaugeSet.add(gauge));
    }
    return runningGaugeSet;
  }, new Set(''));

  const gaugeToProposal = {};
  const proposalToGauge = {};

  Array.from(gaugeSet).forEach((gauge) => {
    if (gauge === '') {
      return;
    }

    const proposal = solidityKeccak256(['address'], [gauge]);
    gaugeToProposal[gauge] = proposal;
    proposalToGauge[proposal] = gauge;
  });

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
