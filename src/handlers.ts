import { utils } from 'ethers';
const { isAddress } = utils;

import {
  parseBribeDeposits,
  createMerkleTree,
  getGaugeToProposalMap,
  createEmptyS3Objects,
  updater,
  getTransferBribesParameters,
  getUpdateRewardsMetadataParameters,
  getClaims,
  getEpochEndTime,
  getDepositBribeParameters,
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

// export const updaterSchedulerHandler = async function updaterSchedulerHandler(event) {
//   try {
//     console.time('updaterScheduler');
//     await updaterScheduler();
//     console.timeEnd('updaterScheduler');
//     return {
//       statusCode: 200,
//       message: 'updaterSchedulerHandler success',
//     };
//   } catch (e) {
//     console.error(e);
//     return { statusCode: 400, body: 'updaterSchedulerHandler error' };
//   }
// };

export const updaterHandler = async function updaterHandler(event) {
  try {
    console.time('updater');
    await updater();
    console.timeEnd('updater');
    return {
      statusCode: 200,
      message: 'updaterHandler success',
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'updaterHandler error' };
  }
};

export const getTransferBribesParametersHandler = async function getTransferBribesParametersHandler(event) {
  try {
    console.time('getTransferBribesParameters');
    const transferBribesParameters = await getTransferBribesParameters();
    console.timeEnd('getTransferBribesParameters');
    return {
      statusCode: 200,
      body: JSON.stringify(transferBribesParameters),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'getTransferBribesParametersHandler error' };
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
  try {
    console.time('getClaims');
    const claims = await getClaims(address);
    console.timeEnd('getClaims');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(claims),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: 'getClaimsHandler error',
    };
  }
};

export const getEpochEndTimeHandler = async function getEpochEndTimeHandler(event) {
  try {
    console.time('getEpochEndTime');
    const epochEndTime = await getEpochEndTime();
    console.timeEnd('getEpochEndTime');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(epochEndTime),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: 'getEpochEndTimeHandler error',
    };
  }
};

export const getDepositBribeParametersHandler = async function getDepositBribeParametersHandler(event) {
  try {
    console.time('getDepositBribeParameters');
    const depositBribeParameters = await getDepositBribeParameters();
    console.timeEnd('getDepositBribeParameters');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(depositBribeParameters),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: 'getDepositBribeParametersHandler error',
    };
  }
};
