import { setLoginRecognized } from './+index.js';

const params = new URLSearchParams(location.hash.slice(1));

const monoidentityloginrecognized = params.get('monoidentityloginrecognized');
if (monoidentityloginrecognized) {
  setLoginRecognized(monoidentityloginrecognized);
}

export const loaded = Boolean(params.size);
if (loaded) {
  history.replaceState(null, '', location.pathname);
}

export const monoidentitysync = params.get('monoidentitysync') || undefined;
