import { Distribution } from '../types';
import { Contract } from 'ethers';
import { contracts } from '../network';
import AWS from 'aws-sdk';
import { BUCKET_NAME } from '../constants';
const s3 = new AWS.S3({ region: 'us-west-2' });

/* Get parameters for RewardDistributor.updateRewardsMetadata(Distribution[] calldata _distributions)
 *
 * type Distribution = {
 *   identifier: string;
 *   token: string;
 *   merkleRoot: string;
 *   proof: string;
 *  };
 *
 * Admin needs to call this after BribeVault.transferBribes(), to enable claims.
 * Note that in our scheme, we are using the bribeId as the unique identifier for each reward.
 */
export const getUpdateRewardsMetadataParameters = async function getUpdateRewardsMetadataParameters(): Promise<
  Distribution[]
> {
  // Debundling two data queries we could have placed in a Promise.all block to enable unit testing, ok compromise because AWS SDK request isn't really a bottleneck for this app.

  const wrappedProcessedBribeIds = await s3
    .getObject({
      Bucket: BUCKET_NAME,
      Key: 'ProcessedBribeIds',
    })
    .promise();

  // Array of bribeIds we have processed (created Merkle tree of bribing rewards for).
  const processedBribeIds: string[] = Array.from(JSON.parse(String(wrappedProcessedBribeIds?.Body)));

  const freshBribeIds = await _getFreshBribeIds(processedBribeIds);

  // Get merkle trees for all freshBribeIds
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
  return _merkleTreesToParameters(merkleTrees);
};

export const _getFreshBribeIds = async function _getFreshBribeIds(processedBribeIds: string[]): Promise<string[]> {
  const rewardDistributor: Contract = contracts['RewardDistributor'];

  // Lol, AWS and blockchain data query in one Promise.all block, efficient but difficult to decouple for unit testing.
  const rewardMetadataUpdatedEvents = await rewardDistributor.queryFilter(
    rewardDistributor.filters.RewardMetadataUpdated()
  );

  // Array of bribeIds which have already had updateRewardsMetadata invoked for.
  const staleBribeIds = rewardMetadataUpdatedEvents.map((event) => event?.args?.identifier);
  // Array of bribeIds which have not had updateRewardsMetadata invoked for.
  const freshBribeIds = processedBribeIds.filter((bribeId) => !staleBribeIds.includes(bribeId));

  return freshBribeIds;
};

export const _merkleTreesToParameters = function _merkleTreesToParameters(
  merkleTrees: { bribeId: string; token: string; merkleRoot: string }[]
): Distribution[] {
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
