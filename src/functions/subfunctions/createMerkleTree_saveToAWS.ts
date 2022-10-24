import { MerkleTreeCollection, MerkleLeafPutRequest } from '../../types';
import AWS from 'aws-sdk';
import { BUCKET_NAME, TABLE_NAME } from '../../constants';
import { sleep } from '../../utils';
const s3 = new AWS.S3({ region: 'us-west-2' });
const dynamodb = new AWS.DynamoDB({ region: 'us-west-2' });

export const createMerkleTree_saveToAWS = async function createMerkleTree_saveToAWS(
  newProcessedBribeIds: string[],
  bribeIdMerkleTrees: MerkleTreeCollection,
  merkleLeafPutRequests: MerkleLeafPutRequest[]
): Promise<void> {
  // Save to S3
  const saveMerkleTreeToS3Promises = Object.keys(bribeIdMerkleTrees).map((bribeId) => {
    return s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: bribeId,
        Body: JSON.stringify(bribeIdMerkleTrees[bribeId]),
      })
      .promise();
  });

  // Also update processedBribeIds array
  saveMerkleTreeToS3Promises.push(
    s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: 'ProcessedBribeIds',
        Body: JSON.stringify(Array.from(newProcessedBribeIds)),
      })
      .promise()
  );

  await Promise.all(saveMerkleTreeToS3Promises);

  // Save to DynamoDB in sequence using BatchWriteItem operation, and exponential backoff retry algorithm

  let currentBatch: MerkleLeafPutRequest[] = [];
  let sleeptime = 0;

  while (merkleLeafPutRequests.length > 0) {
    // Ensure 25 requests in currentBatch
    while (currentBatch.length > 25) {
      merkleLeafPutRequests.push(currentBatch.pop() as MerkleLeafPutRequest);
    }

    while (currentBatch.length < 25 && merkleLeafPutRequests.length > 0) {
      currentBatch.push(merkleLeafPutRequests.shift() as MerkleLeafPutRequest);
    }

    // Construct BatchWriteItem object
    const batchWriteRequest = {
      RequestItems: {
        [TABLE_NAME]: currentBatch,
      },
    };

    // Sleep

    if (sleeptime > 0) {
      await sleep(sleeptime);
    }

    // Make DynamoDB BatchWriteItem request

    try {
      const resp = await dynamodb.batchWriteItem(batchWriteRequest).promise();
      currentBatch = (resp?.UnprocessedItems?.TABLE_NAME as MerkleLeafPutRequest[]) || ([] as MerkleLeafPutRequest[]);
    } catch (e) {
      console.error(e);
      console.log(`error currentBatch: ${JSON.stringify(currentBatch)}`);
    }

    // Determine sleeptime for next iteration
    // If success and nil unprocessed items
    if (currentBatch.length === 0) {
      sleeptime /= 2;
      // Else if error or returned unprocessed items
    } else {
      if (sleeptime === 0) {
        sleeptime = 50;
      } else {
        sleeptime *= 2;
      }
    }
  }

  return;
};
