import { utils, BigNumber } from 'ethers';
const { solidityKeccak256 } = utils;

/**
 * Generate Merkle Tree leaf from address and value
 * @param {string} address of airdrop claimee
 * @param {string} amount of airdrop tokens to claimee
 * @returns {Buffer} Merkle Tree node
 */
export const generateMerkleLeaf = function generateMerkleLeaf(address: string, amount: BigNumber | string): Buffer {
  return Buffer.from(
    // Hash in appropriate Merkle format
    solidityKeccak256(['address', 'uint256'], [address, amount.toString()]).slice(2),
    'hex'
  );
};
