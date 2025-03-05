import { Client } from "minio";

if (!process.env.MINIO_ENDPOINT) {
  throw new Error("MINIO_ENDPOINT is not defined");
}

if (!process.env.MINIO_PORT) {
  throw new Error("MINIO_PORT is not defined");
}

if (!process.env.MINIO_ACCESS_KEY) {
  throw new Error("MINIO_ACCESS_KEY is not defined");
}

if (!process.env.MINIO_SECRET_KEY) {
  throw new Error("MINIO_SECRET_KEY is not defined");
}

export const MinioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Initialize bucket if it doesn't exist
const initBucket = async () => {
  try {
    const exists = await MinioClient.bucketExists("media");
    if (!exists) {
      await MinioClient.makeBucket("media");
      // Set bucket policy to public read
      await MinioClient.setBucketPolicy(
        "media",
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicRead",
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: ["arn:aws:s3:::media/*"],
            },
          ],
        })
      );
    }
  } catch (error) {
    console.error("Error initializing MinIO bucket:", error);
  }
};

initBucket();
