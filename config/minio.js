const Minio = require('minio');

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Bucket name for media storage
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'instagram-media';

// Initialize bucket if it doesn't exist
const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`Bucket policy set for public read access.`);
    } else {
      console.log(`Bucket '${BUCKET_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
};

// Upload file to MinIO
const uploadFile = async (file, fileName) => {
  try {
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Original-Name': file.originalname
    };

    await minioClient.putObject(BUCKET_NAME, fileName, file.buffer, metaData);
    
    // Return the public URL
    const objectUrl = `${process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${BUCKET_NAME}`}/${fileName}`;
    return objectUrl;
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw error;
  }
};

// Delete file from MinIO
const deleteFile = async (fileName) => {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
    console.log(`File '${fileName}' deleted successfully from MinIO.`);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
};

// Get file info from MinIO
const getFileInfo = async (fileName) => {
  try {
    const stat = await minioClient.statObject(BUCKET_NAME, fileName);
    return stat;
  } catch (error) {
    console.error('Error getting file info from MinIO:', error);
    throw error;
  }
};

// Generate presigned URL for private files (if needed)
const getPresignedUrl = async (fileName, expiry = 3600) => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, fileName, expiry);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  initializeBucket,
  uploadFile,
  deleteFile,
  getFileInfo,
  getPresignedUrl
};
