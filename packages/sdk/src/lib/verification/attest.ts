import { generateStudentVueToken } from "./studentvue-client.js";
import useStudentVue from "./use-studentvue.remote.js";

export const attest = async (email: string, password: string) => {
  const token = await generateStudentVueToken(email, password);
  return await useStudentVue({ token, email });
};
