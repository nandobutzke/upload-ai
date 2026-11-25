const { randomUUID } = require('node:crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { json } = require('./http');

const EXPIRES_IN = 900;

const s3 = new S3Client({
  // SDK v3 signs a checksum header by default. The browser PUT only sends
  // Content-Type, so the checksum must stay out of the presigned URL.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const handler = async () => {
  const id = randomUUID();
  const key = `uploads/${id}.mp4`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: 'video/mp4',
    }),
    { expiresIn: EXPIRES_IN },
  );

  return json(200, {
    id,
    url,
    expiresIn: EXPIRES_IN,
  });
};

module.exports = { handler };
