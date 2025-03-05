import { Client } from "minio";

// Initialize MinIO client
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

// Initialize bucket if it doesn't exist
const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists("media");
    if (!exists) {
      await minioClient.makeBucket("media");
      // Set bucket policy to public read
      await minioClient.setBucketPolicy(
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
