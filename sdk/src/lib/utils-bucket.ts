import { encode, decode } from "./utils-base36.js";

export type Bucket = { base: string; accessKeyId: string; secretAccessKey: string };
export const encodeBucket = (bucket: Bucket) => {
  return encode(JSON.stringify(bucket));
};
export const decodeBucket = (data: string) => {
  return JSON.parse(decode(data)) as Bucket;
};
