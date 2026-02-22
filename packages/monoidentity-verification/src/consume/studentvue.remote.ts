import { fn } from "monoserve";
import { string, object, pipe, email, uuid } from "valibot";
import { generateVerificationJWT } from "./lib";
import { districtApps } from "school-districts";

const studentVueTokenSchema = object({
  token: pipe(string(), uuid()),
  email: pipe(string(), email()),
});

export default fn(studentVueTokenSchema, async ({ token, email }) => {
  const domain = email.split("@")[1];
  const apps = districtApps[domain];
  if (!apps) {
    throw new Response("Unknown domain", { status: 400 });
  }

  const svApp = apps.find((app) => app.app == "StudentVue");
  if (!svApp) {
    throw new Response("Domain does not support StudentVue", { status: 400 });
  }

  const base = svApp.base;

  // Fetch the StudentVue page with the token to validate it
  let html: string;
  try {
    const response = await fetch(`${base}/PXP2_Student.aspx?token=${token}`);
    if (!response.ok) {
      throw new Response("Failed to validate token", { status: 400 });
    }
    html = await response.text();
  } catch (e) {
    console.error("StudentVue token validation failed", e);
    throw new Response("StudentVue is inaccessible", { status: 400 });
  }

  // Extract Student ID Number from HTML
  const studentIdMatch = html.match(
    /<span class="tbl_label">Student ID Number:<\/span><span class="value">([^<]+)<\/span>/,
  );

  if (!studentIdMatch || !studentIdMatch[1]) {
    throw new Response("Student ID not found in response", { status: 400 });
  }

  if (email.split("@")[0] != studentIdMatch[1]) {
    throw new Response("Student ID not correct", { status: 400 });
  }

  // Generate and return JWT
  return await generateVerificationJWT(email, "studentvue");
});
