import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Endpoint = process.env.S3_ENDPOINT;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;
const s3Region = process.env.S3_REGION;
export const s3BucketName = process.env.S3_BUCKET_NAME;

export const s3 = new S3Client({
    endpoint: s3Endpoint,
    credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretKey,
    },
    region: s3Region,
    forcePathStyle: true,
});

export const initializeS3 = async () => {
    try {
        const command = new CreateBucketCommand({
            Bucket: s3BucketName,
        });
        await s3.send(command);
    } catch (_) {
        // Bucket might already exist
    }
};
