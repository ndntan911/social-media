# MinIO Setup Guide

This guide will help you set up MinIO for media storage in your Instagram clone application.

## What is MinIO?

MinIO is a high-performance, S3-compatible object storage service that's perfect for storing media files like images and videos. It provides a scalable, distributed storage solution that can be run locally or in production.

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Start all services (MongoDB + MinIO)
docker-compose up -d

# Check if MinIO is running
docker-compose ps
```

This will start:
- **MinIO Server**: `http://localhost:9000`
- **MinIO Console**: `http://localhost:9001`

## Accessing MinIO Console

1. Open your browser and go to `http://localhost:9001`
2. Login with:
   - **Username**: `minioadmin`
   - **Password**: `minioadmin`

## Environment Configuration

Update your `.env` file with the following MinIO settings:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=instagram-media
MINIO_PUBLIC_URL=http://localhost:9000/instagram-media
```

## How It Works

### Automatic Bucket Creation
When your application starts, it will automatically:
1. Connect to MinIO using the configuration
2. Check if the `instagram-media` bucket exists
3. Create the bucket if it doesn't exist
4. Set up public read access policy

### File Upload Process
1. **Frontend**: User uploads files through the multi-file upload component
2. **Backend**: Files are temporarily stored in memory using multer
3. **MinIO**: Files are uploaded to MinIO with unique filenames
4. **Database**: Post records store the MinIO URLs
5. **Frontend**: Media is displayed directly from MinIO URLs

### File Storage Structure
```
instagram-media/
├── 1640995200000-1234567890.jpg
├── 1640995200001-2345678901.mp4
├── 1640995200002-3456789012.png
└── ...
```

## Production Considerations

### Security
- Change default MinIO credentials in production
- Use SSL/TLS (set `MINIO_USE_SSL=true`)
- Implement proper access policies instead of public read

### Performance
- Consider using MinIO clustering for high availability
- Implement CDN for better global performance
- Set up proper backup strategies

### Scaling
- MinIO can handle petabytes of data
- Supports distributed deployments
- Built-in replication and versioning

## Manual MinIO Setup (Without Docker)

If you prefer to install MinIO manually:

1. **Download MinIO**:
   ```bash
   wget https://dl.min.io/server/minio/release/darwin-amd64/minio
   chmod +x minio
   ```

2. **Start MinIO**:
   ```bash
   MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin ./minio server /data --console-address ":9001"
   ```

3. **Configure Environment**:
   Update your `.env` file with the correct endpoint and credentials.

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure MinIO is running: `docker-compose ps`
   - Check if ports 9000 and 9001 are available

2. **Access Denied**:
   - Verify MinIO credentials in `.env`
   - Check bucket policies in MinIO console

3. **File Upload Fails**:
   - Check file size limits (50MB per file)
   - Verify supported file types
   - Check MinIO storage space

### Logs

Check MinIO logs:
```bash
docker-compose logs minio
```

Check application logs:
```bash
docker-compose logs app
```

## MinIO Console Features

The MinIO Console at `http://localhost:9001` provides:
- **File Browser**: View and manage uploaded files
- **Bucket Management**: Create and configure buckets
- **User Management**: Set up access controls
- **Monitoring**: View storage usage and performance

## API Integration

The application uses the MinIO JavaScript SDK for:
- **File Upload**: `minioClient.putObject()`
- **File Deletion**: `minioClient.removeObject()`
- **File Info**: `minioClient.statObject()`
- **Presigned URLs**: `minioClient.presignedGetObject()`

## Next Steps

1. Start the services: `docker-compose up -d`
2. Access MinIO console: `http://localhost:9001`
3. Test file upload in the application
4. Monitor storage usage in MinIO console

Your Instagram clone now has enterprise-grade object storage! 🚀
