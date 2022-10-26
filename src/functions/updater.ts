import AWS from 'aws-sdk';
const lambda = new AWS.Lambda({ region: 'us-west-2' });

// Calls getGaugeToProposalMap, parseBribeDeposits and createMerkleTree functions
// AWS SDK will handle retry-logic
export const updater = async function updater(): Promise<void> {
  console.log(
    await lambda
      .invoke({
        FunctionName: 'solace-swap-bribes-dev-getGaugeToProposalMap',
        InvocationType: 'Event',
        Payload: '',
      })
      .promise()
  );

  console.log(
    await lambda
      .invoke({
        FunctionName: 'solace-swap-bribes-dev-parseBribeDeposits',
        InvocationType: 'Event',
        Payload: '',
      })
      .promise()
  );

  console.log(
    await lambda
      .invoke({
        FunctionName: 'solace-swap-bribes-dev-createMerkleTree',
        InvocationType: 'Event',
        Payload: '',
      })
      .promise()
  );
};
