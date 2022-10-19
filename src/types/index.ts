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
