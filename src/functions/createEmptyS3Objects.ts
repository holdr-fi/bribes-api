import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });
import { s3keys } from '../constants';

export const createEmptyS3Objects = async function createEmptyS3Objects(): Promise<void> {
  const promises = s3keys.map((s3key) => createEmptyS3Object(s3key));
  await Promise.all(promises);
};

const createEmptyS3Object = async function createEmptyS3Object(s3key: string) {
  try {
    await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: s3key,
      })
      .promise();
  } catch {
    console.log(`Creating ${s3key} S3 object`);

    if (s3key === 'ProcessedBribeIds') {
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: s3key,
          Body: JSON.stringify([]),
        })
        .promise();
    }

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: s3key,
        Body: JSON.stringify({}),
      })
      .promise();
  }
};
