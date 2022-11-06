// Required for Mocha unit tests, not for Serverless
import * as dotenv from 'dotenv';
dotenv.config();

if (typeof process.env.MAINNET_URL === 'undefined') {
  throw new Error('Invalid MAINNET_URL in .env');
}
if (typeof process.env.MUMBAI_URL === 'undefined') {
  throw new Error('Invalid MUMBAI_URL in .env');
}
if (typeof process.env.CHAIN_ID === 'undefined') {
  throw new Error('Invalid CHAIN_ID in .env');
}
if (typeof process.env.BUCKET_NAME === 'undefined') {
  throw new Error('Invalid BUCKET_NAME in .env');
}
if (typeof process.env.TABLE_NAME === 'undefined') {
  throw new Error('Invalid TABLE_NAME in .env');
}

export const MAINNET_URL = process.env.MAINNET_URL;
export const MUMBAI_URL = process.env.MUMBAI_URL;
export const CHAIN_ID = process.env.CHAIN_ID;
export const BUCKET_NAME = process.env.BUCKET_NAME;
export const TABLE_NAME = process.env.TABLE_NAME;
