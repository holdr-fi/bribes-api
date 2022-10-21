Offchain bribing system component for Solace Swap. Written using Serverless framework to smoothen the process of writing a Typescript codebase for AWS SAM framework (yes, Serverless is a framework on top of another framework).


Currently the codebase will work for Ethereum mainnet transaction volumes, however will need refactoring to handle 5x+ volumes.

# Deploy

```bash
serverless deploy
```

# Viewed deployed resources

```bash
serverless info
```

# Operation Steps

1. 

```
npm run deploy
```

2. Create Merkle Trees for storage in S3

```bash
serverless invoke local --function createMerkleTree
```

# TODO
Create function get rewardIds for BribeVault.transferBribes()
Create system to query waiting claims