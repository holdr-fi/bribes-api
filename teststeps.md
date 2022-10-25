# Steps to test Bribing System on new network

1. Deploy GaugeController.sol, VotingEscrow.sol, BribeVault.sol, RewardDistributor.sol and BalancerBribe.sol
2. `npm run deploy` to deploy AWS stack
2. Deploy a gauge
3. Call BalancerBribe.setGaugeProposal
4. Call BalancerBribe.depositBribeERC20.sol
5. Vote on bribed gauge via GaugeController
6. `npm run update` to parse recent bribe system events
7. Call BribeVault.transferBribes() with parameters from getTransferBribesParameters Lambda
8. Call RewardDistributor.updateRewardsMetadata() with parameters from getUpdateRewardsMetadataParameters Lambda
9. Call RewardDistributor.claim() from getClaims Lambda

# Notes

BalancerBribe.setGaugeProposal(address gauge, uint256 deadline), should also set a cronjob to run `npm run update` at the same Unix timestamp as deadline, or else count wrong votes.

