// This isn't encryption, it's just to prevent casual observation of sensitive data
export const encode = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    output += bytes[i].toString(36).padStart(2, "0");
  }
  return output;
};
export const decode = (text: string) => {
  const bytes = new Uint8Array(text.length / 2);
  for (let i = 0; i < text.length; i += 2) {
    bytes[i / 2] = parseInt(text.slice(i, i + 2), 36);
  }
  return new TextDecoder().decode(bytes);
};
