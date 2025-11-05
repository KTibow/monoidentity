import { fn } from "monoserve";
import { string } from "valibot";
import { encodeBucket } from "./specific-utils";
import { useVerification } from "monoidentity/server";
import { CF_ACCOUNT_ID, CF_KEY } from "$env/static/private";

const KV_NAMESPACE_ID = "6b33cf77a0bf4a029bc17b738c9f2cdb";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default fn(string(), async (jwt) => {
  // Verify JWT and get user email
  const { payload } = await useVerification(jwt);
  const user = payload.sub!.replace(/[@.]/g, "-");

  // Check if credentials already exist in KV
  const existingCreds = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${user}`,
    {
      headers: { authorization: `Bearer ${CF_KEY}` },
    },
  );

  if (existingCreds.ok) {
    return await existingCreds.text(); // Already encoded
  }

  // Generate unique bucket name
  const bucketName = `monoidentity-cloud-${user}`;

  // 1. Create R2 bucket
  const bucketRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${CF_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: bucketName }),
    },
  );

  if (!bucketRes.ok) {
    throw new Error(`Failed to create bucket: ${await bucketRes.text()}`);
  }

  // 2. Set CORS policy
  const corsConfig = {
    rules: [
      {
        allowed: {
          origins: ["*"],
          methods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          headers: [
            "authorization",
            "content-type",
            "if-match",
            "if-none-match",
            "x-amz-date",
            "x-amz-content-sha256",
          ],
        },
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3600,
      },
    ],
  };

  const corsRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucketName}/cors`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${CF_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(corsConfig),
    },
  );

  if (!corsRes.ok) {
    throw new Error(`Failed to set CORS: ${await corsRes.text()}`);
  }

  // 3. Create scoped API token
  const tokenRes = await fetch(`https://api.cloudflare.com/client/v4/user/tokens`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${CF_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: `monoidentity-cloud-token-${user}`,
      policies: [
        {
          effect: "allow",
          resources: {
            [`com.cloudflare.edge.r2.bucket.${CF_ACCOUNT_ID}_default_${bucketName}`]: "*",
          },
          permission_groups: [{ id: "2efd5506f9c8494dacb1fa10a3e7d5b6" }], // Workers R2 Storage Bucket Item Write
        },
      ],
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to create token: ${await tokenRes.text()}`);
  }

  const {
    result: { id: accessKeyId, value: secretAccessKeyInput },
  } = await tokenRes.json();
  const secretAccessKey = await sha256(secretAccessKeyInput);

  // 4. Encode and store in KV
  const encoded = encodeBucket({
    base: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}`,
    accessKeyId,
    secretAccessKey,
  });

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${user}`,
    {
      method: "PUT",
      headers: { authorization: `Bearer ${CF_KEY}` },
      body: encoded,
    },
  );

  return encoded;
});
