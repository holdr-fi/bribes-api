import { parseBribeDeposits, createMerkleTree } from './functions';

export const parseBribeDepositsHandler = async function parseBribeDepositsHandler(event) {
  try {
    console.time('parseBribeDeposits');
    await parseBribeDeposits();
    console.timeEnd('parseBribeDeposits');
    return {
      statusCode: 200,
      body: 'parseBribeDeposits success, saved to ParseBribeDepositResults object in S3',
      input: event,
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'parseBribeDepositsHandler error' };
  }
};

export const createMerkleTreeHandler = async function createMerkleTreeHandler(event) {
  try {
    console.time('createMerkleTree');
    await createMerkleTree();
    console.timeEnd('createMerkleTree');
    return {
      statusCode: 200,
      body: 'createMerkleTreeHandler success',
      input: event,
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'createMerkleTreeHandler error' };
  }
};
