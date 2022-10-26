Offchain bribing system component for Solace Swap. Written using Serverless framework to smoothen the process of writing a Typescript codebase for AWS SAM framework (yes, Serverless is a framework on top of another framework).


Currently the codebase will work for Ethereum mainnet transaction volumes, however will need refactoring to handle 5x+ volumes.

# Deploy

```bash
npm run deploy
```

# Redeploy 

```bash
npm run redeploy
```

# Viewing deployed resources (useful for getting API URL)

```bash
serverless info
```

# Take snapshot of current blockchain state (generate Merkle trees for bribes)

```bash
npm run update
```

# Obtain claims data for 'address'

```bash
curl <API_URL>/claims/?address=0x71C7656EC7ab88b098defB751B7401B5f6d8976F
```

# Obtain updateRewardsMetadata parameters

```bash
curl <API_URL>/rewardsmetadata
```

# Obtain transferBribes parameters

```bash
curl <API_URL>/transferbribes
```