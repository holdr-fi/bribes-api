import { BigNumber } from 'ethers';
import MerkleTree from 'merkletreejs';

export type Distribution = {
  identifier: string;
  token: string;
  merkleRoot: string;
  proof: string;
};

export type Claim = {
  token: string;
  amount: BigNumber | string;
  claimParams: ClaimParams;
};

export type ClaimParams = {
  identifier: string;
  account: string;
  amount: string;
  merkleProof: string[];
};

export type MerkleTreeCollection = {
  [bribeId: string]: { bribeId: string; token: string; merkleRoot: string; merkleTree: MerkleTree };
};

export type MerkleLeafPutRequest = {
  PutRequest: {
    Item: {
      voter: { [keyType: string]: string };
      bribeId: { [keyType: string]: string };
      token: { [keyType: string]: string };
      amount: { [keyType: string]: string };
    };
  };
};

export type MerkleDBQuery = {
  voter: { [attributeType: string]: string };
  amount: { [attributeType: string]: string };
  token: { [attributeType: string]: string };
  bribeId: { [attributeType: string]: string };
};
