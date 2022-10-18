import { contracts } from './network';

export const parseBribeDeposits = async function parseBribeDeposits(event) {
  const bribeVault = contracts['bribeVault'];
  const fee = await bribeVault.FEE_MAX();
  return {
    message: `Go Serverless v3! Fee: ${fee}`,
    input: event,
  };
};
