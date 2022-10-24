import MerkleTree from 'merkletreejs';
import { PutRequest } from 'aws-sdk/clients/dynamodb';

export type Distribution = {
  identifier: string;
  token: string;
  merkleRoot: string;
  proof: string;
};

export type Claim = {
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
