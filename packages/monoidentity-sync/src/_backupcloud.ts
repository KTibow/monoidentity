import { keyIsPlainText } from './utils-key-info';

export const encodeCloudContent = (key: string, value: string) => {
  if (keyIsPlainText(key)) {
    return value;
  }

  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i);
  }
  return bytes;
};

export const decodeCloudContent = async (key: string, response: Response) => {
  if (keyIsPlainText(key)) {
    return response.text();
  }

  const buf = new Uint8Array(await response.arrayBuffer());
  let content = '';
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) {
    content += String.fromCharCode.apply(null, buf.subarray(i, i + chunk) as unknown as number[]);
  }
  return content;
};
