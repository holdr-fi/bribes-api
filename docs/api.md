# API Endpoints

## Get RewardDistributor.claim() parameters

Required for voters to claim bribing rewards

```
GET /claims?address={EVM_ADDRESS}
```

### Parameters
| Name | Type | Description |
|---|---|---|
|EVM_ADDRESS|string|EVM address of voter|

### Return values
| Name | Type | Description |
|---|---|---|
|claims|Claim[]|Array of Claim information|

### Claim types

```js
type Claim = {
  token: string;
  amount: BigNumber | string;
  claimParams: ClaimParams;
};

type ClaimParams = {
  identifier: string;
  account: string;
  amount: string;
  merkleProof: string[];
};
```

#### Claim properties
| Property | Type | Description |
|---|---|---|
|token|string|Address of ERC20 reward token|
|amount|string|Amount of bribe reward|
|claimParams|ClaimParams|Required parameter for RewardDistributor.claim() function|

#### ClaimParams properties
Actual parameter required for RewardDistributor.claim()
| Property | Type | Description |
|---|---|---|
|identifier|string|Unique identifier for bribe (each bribe has a unique identifier depending on gauge, bribe token and deadline)|
|account|string|EVM address of claimer|
|amount|string|Amount of bribe reward|
|merkleProof|string|Merkle proof|

<br/>

## Get BribeVault.depositBribeERC20() parameters

```
GET /depositbribe
```

### Return values
| Name | Type | Description |
|---|---|---|
|proposalsAndGauges|ProposalAndGauge[]|Array of active proposals (and associated gauge and pool)|
|tokens|string[]|Array of tokens whitelisted for bribes|

### ProposalAndGauge type

```js
type ProposalAndGauge = {
  proposal: string;
  gauge: string;
  pool: string;
  gaugeName: string;
};
```

| Property | Type | Description |
|---|---|---|
|proposal|string|proposal ID|
|gauge|string|Corresponding gauge, each proposal ID maps one-to-one to a gauge|

<br/>

## Get bribing epoch end timestamp

```
GET /epochend
```

### Return values
| Name | Type | Description |
|---|---|---|
|deadline|number|Unix timestamp of next epoch end (if there is no active bribe, this will get the end timestamp of the most recent epoch)|