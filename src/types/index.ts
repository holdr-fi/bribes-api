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
  Item: {
    voter: { [keyType: DynamoDBKeyType]: string };
    bribeId: string;
    token: string;
    amount: string;
  };
};

export type DynamoDBKeyType = {
  type: 'S' | 'N';
};
