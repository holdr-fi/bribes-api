import { utils } from 'ethers';
const { isAddress } = utils;

import {
  parseBribeDeposits,
  createMerkleTree,
  deleteS3Objects,
  getGaugeToProposalMap,
  createEmptyS3Objects,
  getUpdateRewardsMetadataParameters,
  getClaims,
} from './functions';

export const parseBribeDepositsHandler = async function parseBribeDepositsHandler(event) {
  try {
    console.time('parseBribeDeposits');
    await parseBribeDeposits();
    console.timeEnd('parseBribeDeposits');
    return {
      statusCode: 200,
      body: 'parseBribeDeposits success, saved to ParseBribeDepositResults object in S3',
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
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'createMerkleTreeHandler error' };
  }
};

export const getGaugeToProposalMapHandler = async function getGaugeToProposalMapHandler(event) {
  try {
    console.time('getGaugeToProposal');
    await getGaugeToProposalMap();
    console.timeEnd('getGaugeToProposal');
    return {
      statusCode: 200,
      body: 'getGaugeToProposalHandler success',
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'getGaugeToProposalHandler error' };
  }
};

export const createEmptyS3ObjectsHandler = async function createEmptyS3ObjectsHandler(event) {
  try {
    console.time('createEmptyS3Objects');
    await createEmptyS3Objects();
    console.timeEnd('createEmptyS3Objects');
    return {
      statusCode: 200,
      message: 'createEmptyS3ObjectsHandler success',
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'createEmptyS3ObjectsHandler error' };
  }
};

export const deleteS3ObjectsHandler = async function deleteS3ObjectsHandler(event) {
  try {
    console.time('deleteS3Objects');
    await deleteS3Objects();
    console.timeEnd('deleteS3Objects');
    return {
      statusCode: 200,
      message: 'deleteS3ObjectsHandler success',
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'deleteS3ObjectsHandler error' };
  }
};

export const getUpdateRewardsMetadataParametersHandler = async function getUpdateRewardsMetadataParametersHandler(
  event
) {
  try {
    console.time('getUpdateRewardsMetadataParameters');
    const updateRewardsMetadataParameters = await getUpdateRewardsMetadataParameters();
    console.timeEnd('getUpdateRewardsMetadataParameters');
    return {
      statusCode: 200,
      body: JSON.stringify(updateRewardsMetadataParameters),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'getUpdateRewardsMetadataParametersHandler error' };
  }
};

export const getClaimsHandler = async function getClaimsHandler(event) {
  // How to add event with address here?
  const address: string = event?.queryStringParameters?.address || '';
  if (!isAddress(address)) {
    return { statusCode: 400, body: `getClaimsHandler error, ${address} is not an Ethereum address` };
  }
  console.log(`Address: ${address}`);
  try {
    console.time('getClaims');
    const claims = await getClaims(address);
    console.timeEnd('getClaims');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(claims),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'getClaimsHandler error' };
  }
};
