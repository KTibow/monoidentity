import type { Dict } from "./createstore.js";
import { wrapWithReplay } from "./_replay.js";
import type { Bucket } from "../utils-bucket.js";
import { AwsClient } from "aws4fetch";
import { CLOUD_CACHE_KEY, loadCloud } from "./_cloud.js";
import { md5 } from "./_md5.js";

export const wrapCloud = async (storage: Dict, bucket: Bucket) => {
  const client = new AwsClient({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
  });
  const { proxy, setTransmit, flush, load } = wrapWithReplay(storage);
  const isFirstLoad = !localStorage[CLOUD_CACHE_KEY];
  if (isFirstLoad) {
    const data = await loadCloud(bucket.base, client);
    load(data);
  }
  setTransmit(async (path, mod) => {
    if (mod.type == "set") {
      const url = `${bucket.base}/${path}`;
      const headers = new Headers();

      if (mod.old) {
        // Update only if current matches our known prior content
        const etagFromOld = md5(mod.old);
        headers.set("If-Match", `"${etagFromOld}"`);
      } else {
        // Create only if it does not already exist
        headers.set("If-None-Match", "*");
      }

      const r = await client.fetch(url, {
        method: "PUT",
        headers,
        body: mod.new,
      });
      if (!r.ok) {
        throw new Error(`Cloud is ${r.status}ing`);
      }
    } else if (mod.type == "delete") {
      const url = `${bucket.base}/${path}`;
      const r = await client.fetch(url, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(`Cloud is ${r.status}ing`);
    }
  });
  if (!isFirstLoad) {
    flush().then(async () => {
      const data = await loadCloud(bucket.base, client);
      load(data);
    });
  }

  return proxy;
};
