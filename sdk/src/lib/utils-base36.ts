// This isn't encryption, it's just to prevent casual observation of sensitive data
export const encode = (text: string) => {
  let output = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    output += charCode.toString(36).padStart(2, "0");
  }
  return output;
};
export const decode = (text: string) => {
  let output = "";
  for (let i = 0; i < text.length; i += 2) {
    const charCode = parseInt(text.slice(i, i + 2), 36);
    output += String.fromCharCode(charCode);
  }
  return output;
};
export const encodeShallow = <T extends Record<string, string>>(obj: T) => {
  const result: Record<string, string> = {};
  for (const key in obj) {
    result[key] = encode(obj[key]);
  }
  return result as T;
};
export const decodeShallow = <T extends Record<string, string>>(obj: T) => {
  const result: Record<string, string> = {};
  for (const key in obj) {
    result[key] = decode(obj[key]);
  }
  return result as T;
};
