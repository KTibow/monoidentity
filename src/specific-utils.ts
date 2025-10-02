import districts from "school-districts";
export const domains: string[] = Object.keys(districts);
export const knownApps: Record<string, string> = {
  "https://secanthq.web.app": "Secant",
};
export const logoMonoidentity = {
  body: `<path d="M5 21a1 1 0 01-1-1v-1l-.6-.4Q3 18.5 3 18v-3a1 1 0 011-1h1V7a1 1 0 018 0v10a1 1 0 004 0v-7h-1a1 1 0 01-1-1V6q0-1.6 3-1.6T21 6v3a1 1 0 01-1 1h-1v7a1 1 0 01-8 0V7a1 1 0 00-4 0v7h1a1 1 0 011 1v3q0 .4-.4.6T8 19v1a1 1 0 01-1 1zM18 4a.4.4 90 000-3 .4.4 90 000 3" fill="currentColor"/>`,
  width: 24,
  height: 24,
};
