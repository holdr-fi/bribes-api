import { Distribution } from '../types';
import { Contract } from 'ethers';
import { contracts } from '../network';
import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../constants';
const s3 = new AWS.S3({ region: 'us-west-2' });

export const getUpdateRewardsMetadataParameters = async function getUpdateRewardsMetadataParameters(): Promise<
  Distribution[]
> {
  const rewardDistributor: Contract = contracts['RewardDistributor'];
  const eventFilter = rewardDistributor.filters.RewardMetadataUpdated();

  const [rewardMetadataUpdatedEvents, wrappedProcessedBribeIds] = await Promise.all([
    rewardDistributor.queryFilter(eventFilter),
    s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: 'ProcessedBribeIds',
      })
      .promise(),
  ]);

  // Get stale bribeIDs from RewardMetadataUpdated events from RewardDistributor.sol

  // Compare with processedBribeIds to get freshBribeIds
  const processedBribeIds: string[] = Array.from(JSON.parse(String(wrappedProcessedBribeIds?.Body)));
  const staleBribeIds = rewardMetadataUpdatedEvents.map((event) => event?.args?.identifier);
  const freshBribeIds = processedBribeIds.filter((bribeId) => !staleBribeIds.includes(bribeId));

  // Get merkle trees
  const wrappedMerkleTrees = await Promise.all(
    freshBribeIds.map((bribeId) => {
      return s3
        .getObject({
          Bucket: BUCKET_NAME,
          Key: bribeId,
        })
        .promise();
    })
  );

  const merkleTrees = wrappedMerkleTrees.map((wrappedMerkleTree) => JSON.parse(String(wrappedMerkleTree?.Body)));

  const updateRewardsMetadataParameters = merkleTrees.map((merkleTree) => {
    return {
      identifier: merkleTree.bribeId,
      token: merkleTree.token,
      merkleRoot: merkleTree.merkleRoot,
      proof: '0x',
    };
  });

  return updateRewardsMetadataParameters;
};
