import { BUCKET_NAME } from '../constants';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: 'us-west-2' });
import { s3keys } from '../constants';

export const deleteS3Objects = async function deleteS3Objects(): Promise<void> {
  const promises = s3keys.map((s3key) => deleteS3Object(s3key));
  await Promise.all(promises);
};

const deleteS3Object = async function deleteS3Object(s3key: string) {
  await s3
    .deleteObject({
      Bucket: BUCKET_NAME,
      Key: s3key,
    })
    .promise();
};
