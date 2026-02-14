import type { Bucket } from "../utils-transport.js";
import { AwsClient } from "aws4fetch";

export type AwsFetch = (path: string, options?: RequestInit) => Promise<Response>;
export const createCloudClient = (bucket: Bucket): AwsFetch => {
  const awsClient = new AwsClient({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
  });
  const base = bucket.base.endsWith("/") ? bucket.base : bucket.base + "/";

  return (path, options) => awsClient.fetch(base + path, { ...options, aws: { signQuery: true } });
};
