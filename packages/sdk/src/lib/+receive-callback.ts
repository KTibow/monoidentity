import { setLoginRecognized } from './storage.js';

const params = new URLSearchParams(location.hash.slice(1));

const monoidentityloginrecognized = params.get('monoidentityloginrecognized');
if (monoidentityloginrecognized) {
  setLoginRecognized(monoidentityloginrecognized);
}

if (params.size) {
  history.replaceState(null, '', location.pathname);
}

export const monoidentitysync = params.get('monoidentitysync') || undefined;
