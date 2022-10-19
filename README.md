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

1. Create empty S3 objects (avoid error when attempt to retrieve in later steps)

```bash
serverless invoke local --function createEmptyS3Objects
```

2. Create S3 caches from parsing Solidity events

```bash
serverless invoke local --function getGaugeToProposalMap
serverless invoke local --function parseBribeDeposits
```

# TODO
Create function get rewardIds for BribeVault.transferBribes()
Create system to query waiting claims