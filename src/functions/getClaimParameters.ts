import { Claim } from '../types';
import { Contract } from 'ethers';
import { contracts } from '../network';
import AWS from 'aws-sdk';
// import { BUCKET_NAME } from '../constants';
// const s3 = new AWS.S3({ region: 'us-west-2' });

// Should get all eligible claims
// Inefficient to search every merkle tree created
// Need own database with primary key = address, secondary key = identifier
// Get all Claim events, hopefully indexed and find fresh ones

export const getClaimParameters = async function getClaimParameters(address: string): Promise<Claim[]> {
  // Get all identifiers
  // const rewardDistributor: Contract = contracts['RewardDistributor'];
  // const eventFilter = rewardDistributor.filters.RewardClaimed(null, null, address);
  return [{ identifier: '', account: '', amount: '', merkleProof: [''] }];
};
