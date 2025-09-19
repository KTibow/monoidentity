export type Login = { email: string; password: string };
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
