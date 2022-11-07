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
|token|string|Address of ERC20 reward token|
|amount|string|Amount of bribe reward|
|claimParams|Claim|Required parameter for RewardDistributor.claim() function|

### Claim struct

```js
struct Claim {
    identifier: string
    account: string 
    amount: string
    merkleProof: string
}
```

| Property | Type | Description |
|---|---|---|
|identifier|string|Unique identifier for bribe (each bribe has a unique identifier depending on gauge, bribe token and deadline)|
|account|string|EVM address of claimer|
|amount|Claim|Amount of bribe reward|
|merkleProof|Claim|Merkle proof|

<br/>

## Get BribeVault.depositBribeERC20() parameters

```
GET /depositbribe
```

### Return values
| Name | Type | Description |
|---|---|---|
|proposalsAndGauges|ProposalAndGauge[]|Array of active proposals (and corresponding gauges)|
|tokens|string[]|Array of tokens whitelisted for bribes|

### ProposalAndGauge type

```js
type ProposalAndGauge = {
  proposal: string;
  gauge: string;
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

