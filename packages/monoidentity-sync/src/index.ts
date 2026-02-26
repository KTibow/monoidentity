import { get } from 'idb-keyval';
import { createCloudClient } from './backupcloud-connection';
import { cloudPush } from './backupcloud-push';
import { store } from './utils-idb';
import { localPush } from './backuplocal-push';
import { KEY_CLOUD, KEY_LOCAL_ENABLED } from './utils-config';

export { default as createBucket } from './bucket-create.remote';

export { cloudPull } from './backupcloud-pull';
export { localPull } from './backuplocal-pull';

export const hasMethod = localStorage[KEY_CLOUD] || localStorage[KEY_LOCAL_ENABLED];
export const localAvailable =
  navigator.userAgent.includes('CrOS') && 'showDirectoryPicker' in window;

export const autopush = async () => {
  const controller = new AbortController();
  if (localStorage[KEY_CLOUD]) {
    const client = createCloudClient(JSON.parse(localStorage['monoidentity-sync/cloud']));
    cloudPush(client, controller.signal);
  }
  if (localStorage[KEY_LOCAL_ENABLED]) {
    const handle = await get('handle', store);
    localPush(handle, controller.signal);
  }

  return () => controller.abort();
};
