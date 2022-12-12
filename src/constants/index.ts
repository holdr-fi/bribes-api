import { BigNumber } from 'ethers';

export const DAY = 86400;
export const WEEK = 604800;
export const ZERO = BigNumber.from('0');
export const ONE = BigNumber.from(10).pow(18);
export const TEN_BASE = BigNumber.from('10');
export const TEN_THOUSAND = ONE.mul(10000);
export const ADMIN_ADDRESS = '0xC32e0d89e25222ABb4d2d68755baBF5aA6648F15';
export * from './env';
export * from './s3keys';
