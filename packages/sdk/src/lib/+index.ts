import { stringify, parse } from 'devalue';
import { parse as useSchema } from 'valibot';
import { decode } from 'base36-esm';
import { storageClient } from './storageclient.svelte.js';
import { object, pipe, email, string } from 'valibot';

const loginSchema = object({ email: pipe(string(), email()), password: string() });

const LOGIN_RECOGNIZED_PATH = '.local/login.encjson';
export const getLoginRecognized = () => {
  const client = storageClient();
  const login = client[LOGIN_RECOGNIZED_PATH];
  if (!login) throw new Error('No login found');
  return useSchema(loginSchema, JSON.parse(decode(login)));
};
export const setLoginRecognized = (login: string) => {
  const client = storageClient();
  client[LOGIN_RECOGNIZED_PATH] = login;
};

const isLocalhostHost = (host: string) =>
  host == 'localhost' ||
  host == '127.0.0.1' ||
  host == '0.0.0.0' ||
  host == '[::1]' ||
  host.endsWith('.localhost');

export const openHub = (path: string) => {
  const target = new URL(`https://monoidentity.web.app/${path}`);
  if (isLocalhostHost(location.hostname)) {
    const redirectParams = new URLSearchParams();
    redirectParams.set('redirect', location.origin);
    target.hash = redirectParams.toString();
  }
  location.href = target.toString();
  throw new Error('relogging');
};
export const relog = () => openHub(MONOIDENTITY_APP_ID);

export const getStorage = (realm: 'config' | 'userdata' | 'cache' | (string & {})) => {
  const prefix = `.${realm}/${MONOIDENTITY_APP_ID}/`;
  return storageClient(
    (key) => `${prefix}${key}.devalue`,
    (key) => (key.startsWith(prefix) ? key.slice(prefix.length, -'.devalue'.length) : undefined),
    stringify,
    parse,
  );
};
export const getScopedFS = (dir: string) =>
  storageClient(
    (key) => `${dir}/${key}`,
    (key) => (key.startsWith(dir + '/') ? key.slice(dir.length + 1) : undefined),
  );
