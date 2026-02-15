import { districtApps } from "school-districts";
import fastStudentvue from "fast-studentvue";

const studentvue = (
  email: string,
  password: string,
  methodName: string,
  params: Record<string, string> = {},
) =>
  fastStudentvue(
    { email, password },
    () => {
      throw new Error("Invalid auth");
    },
    methodName,
    params,
  );

export const generateStudentVueToken = async (email: string, password: string) => {
  const domain = email.split("@")[1];
  const apps = districtApps[domain];
  if (!apps) {
    throw new Error("Unknown domain");
  }

  const svApp = apps.find((app) => app.app == "StudentVue");
  if (!svApp) {
    throw new Error("Domain does not support StudentVue");
  }

  const response = await studentvue(email, password, "GenerateAuthToken", {
    Username: "",
    TokenForClassWebSite: "true",
    DocumentID: "1",
    AssignmentID: "1",
  });

  const token = response.AuthToken["@_EncyToken"];

  return token;
};
