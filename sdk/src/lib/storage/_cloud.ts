import type { AwsClient } from "aws4fetch";

const bytesToBinaryString = (bytes: Uint8Array) => {
  const chunkSize = 8192;
  let result = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return result;
};

export const CLOUD_CACHE_KEY = "monoidentity-x/cloud-cache";
type Cache = Record<string, { etag: string; content: string }>;

export const loadCloud = async (url: string, client: AwsClient) => {
  // List bucket (source of truth)
  const listResponse = await client.fetch(url);
  const listXml = await listResponse.text();

  const objects = [...listXml.matchAll(/<Key>(.*?)<\/Key>.*?<ETag>(.*?)<\/ETag>/gs)]
    .map((m) => m.slice(1).map((s) => s.replaceAll("&quot;", `"`).replaceAll("&apos;", `'`)))
    .map(([key, etag]) => ({ key, etag: etag.replaceAll(`"`, "") }))
    .filter(({ key }) => !key.includes(".obsidian"));

  // Build model by enriching list with content
  const model: Record<string, string> = {};
  const cache: Cache = JSON.parse(localStorage[CLOUD_CACHE_KEY] || "{}");
  const newCache: Cache = {};

  await Promise.all(
    objects.map(async ({ key, etag }) => {
      // Cache hit: reuse existing content
      if (cache[key]?.etag == etag) {
        model[key] = cache[key].content;
        newCache[key] = cache[key];
        return;
      }

      // Cache miss: fetch from S3
      const response = await client.fetch(`${url}/${key}`);
      const buffer = await response.arrayBuffer();
      const content = bytesToBinaryString(new Uint8Array(buffer));

      model[key] = content;
      newCache[key] = { etag, content };
    }),
  );

  localStorage[CLOUD_CACHE_KEY] = JSON.stringify(newCache);

  return model;
};
