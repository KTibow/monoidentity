const isPlainTextCloudObject = (key: string) =>
  key.endsWith(".md") || key.endsWith(".devalue");

export const encodeCloudContent = (key: string, value: string) => {
  if (isPlainTextCloudObject(key)) {
    return value;
  }

  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i);
  }
  return bytes;
};

export const decodeCloudContent = async (key: string, response: Response) => {
  if (isPlainTextCloudObject(key)) {
    return response.text();
  }

  const buf = new Uint8Array(await response.arrayBuffer());
  let content = "";
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) {
    content += String.fromCharCode.apply(null, buf.subarray(i, i + chunk) as unknown as number[]);
  }
  return content;
};
