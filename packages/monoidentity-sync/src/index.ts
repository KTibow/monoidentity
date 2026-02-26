import { get } from 'idb-keyval';
import { createCloudClient } from './backupcloud-connection';
import { cloudPush } from './backupcloud-push';
import { store } from './utils-idb';
import { localPush } from './backuplocal-push';
import { KEY_CLOUD, KEY_LOCAL_ENABLED } from './utils-config';

export { createCloudClient } from './backupcloud-connection';
export { cloudPull } from './backupcloud-pull';
export { localPull } from './backuplocal-pull';

export { default as createBucket } from './bucket-create.remote';
export { KEY_CLOUD, KEY_LOCAL_ENABLED, KEY_SKIP } from './utils-config';
export type { Bucket } from './types';

export const localAvailable =
  navigator.userAgent.includes('CrOS') && 'showDirectoryPicker' in window;

export const autopush = () => {
  if (localStorage[KEY_CLOUD]) {
    const controller = new AbortController();
    const client = createCloudClient(JSON.parse(localStorage['monoidentity-sync/cloud']));
    cloudPush(client, controller.signal);
    return () => controller.abort();
  }
  if (localStorage[KEY_LOCAL_ENABLED]) {
    const controller = new AbortController();
    get('handle', store).then((handle) => {
      controller.signal.throwIfAborted();
      localPush(handle, controller.signal);
    });
    return () => controller.abort();
  }
};
