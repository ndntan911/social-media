#!/usr/bin/env node

const { initializeBucket } = require('../config/minio');

console.log('🚀 Initializing MinIO setup...');

initializeBucket()
  .then(() => {
    console.log('✅ MinIO setup completed successfully!');
    console.log('📦 Bucket is ready for media storage');
    console.log('🌐 Access MinIO Console at: http://localhost:9001');
    console.log('👤 Login with: minioadmin / minioadmin');
  })
  .catch((error) => {
    console.error('❌ MinIO setup failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure MinIO is running: docker-compose up -d');
    console.log('2. Check MinIO status: docker-compose ps');
    console.log('3. Verify environment variables in .env file');
    console.log('4. Check MinIO logs: docker-compose logs minio');
    process.exit(1);
  });
