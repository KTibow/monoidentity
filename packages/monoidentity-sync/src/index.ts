import { get } from 'idb-keyval';
import { createCloudClient } from './backupcloud-connection';
import { cloudPush } from './backupcloud-push';
import { store } from './utils-idb';
import { localPush } from './backuplocal-push';
import { KEY_CLOUD, KEY_LOCAL_ENABLED } from './utils-config';

export { createCloudClient } from './backupcloud-connection';
export { cloudStartPull } from './backupcloud-pull';
export { localPull } from './backuplocal-pull';

export { default as createBucket } from './bucket-create.remote';
export { KEY_CLOUD, KEY_LOCAL_ENABLED, KEY_SKIP } from './utils-config';
export type { Bucket } from './types';

export const localAvailable =
  navigator.userAgent.includes('CrOS') && 'showDirectoryPicker' in window;

export const autopush = (signal: AbortSignal) => {
  if (localStorage[KEY_CLOUD]) {
    const client = createCloudClient(JSON.parse(localStorage['monoidentity-sync/cloud']));
    cloudPush(client, signal);
  }
  if (localStorage[KEY_LOCAL_ENABLED]) {
    get('handle', store).then((handle) => {
      signal.throwIfAborted();
      localPush(handle, signal);
    });
  }
};
