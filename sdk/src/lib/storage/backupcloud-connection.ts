import type { Bucket } from "../utils-transport.js";
import { AwsClient } from "aws4fetch";
import type { AwsFetch } from "./backupcloud-pull.js";

export const createCloudClient = (bucket: Bucket): AwsFetch => {
  const awsClient = new AwsClient({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
  });

  return (url, options) => awsClient.fetch(url, { ...options, aws: { signQuery: true } });
};
