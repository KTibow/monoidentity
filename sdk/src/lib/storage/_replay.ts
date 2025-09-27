import type { Dict } from "./createstore.js";
import { throttle } from "./_timing.js";

type Modification = { type: "set"; old?: string; new: string } | { type: "delete" };
type Modifications = Record<string, Modification>;
type Transmit = (path: string, mod: Modification) => Promise<void>;

export const wrapWithReplay = (storage: Dict) => {
  let modifications: Modifications = {};
  if (localStorage["monoidentity-x/backup/modifications"]) {
    modifications = JSON.parse(localStorage["monoidentity-x/backup/modifications"]);
  }

  const save = () => {
    if (Object.keys(modifications).length) {
      localStorage["monoidentity-x/backup/modifications"] = JSON.stringify(modifications);
    } else {
      delete localStorage["monoidentity-x/backup/modifications"];
    }
  };
  window.addEventListener("beforeunload", save);
  window.addEventListener("pagehide", save);

  let transmit: Transmit | undefined;
  const flush = throttle(async () => {
    try {
      const tx = transmit;
      if (!tx) return;
      const paths = Object.keys(modifications);
      const tasks = paths
        .map(async (path) => {
          const mod = modifications[path];
          await tx(path, mod);
        })
        .map((task, i) =>
          task
            .then(() => {
              const path = paths[i];
              delete modifications[path];
            })
            .catch((err) => {
              const path = paths[i];
              console.warn("[monoidentity] transmit failed, will retry later", { path, err });
            }),
        );
      await Promise.all(tasks);
    } finally {
      save();
    }
  }, 1000);

  const proxy = new Proxy(storage, {
    set(target, prop: string, value) {
      let old: string | undefined = target[prop];
      target[prop] = value;

      const oldMod = modifications[prop];
      if (oldMod?.type == "set") old = oldMod.old;
      modifications[prop] = { type: "set", old, new: value };
      flush();
      return true;
    },
    deleteProperty(target, prop: string) {
      const success = delete target[prop];
      if (success) {
        modifications[prop] = { type: "delete" };
        flush();
      }
      return success;
    },
  });

  return {
    proxy,
    flush,
    setTransmit(tx: Transmit) {
      transmit = tx;
    },
    // load() just resets to the external version
    // if you have modifications, flush() them first
    async load(external: Dict) {
      modifications = {};
      for (const [key, value] of Object.entries(external)) {
        storage[key] = value;
      }
      for (const key of Object.keys(storage)) {
        if (!(key in external)) {
          delete storage[key];
        }
      }

      // // If for *some* reason, there are pending modifications, rebase and resend them
      // for (const [key, mod] of Object.entries(oldModifications)) {
      //   if (mod.type == "set") {
      //     if (proxy[key] != mod.old)
      //       console.warn(
      //         `[monoidentity] modification to "${key}" will be force applied over external change`,
      //       );
      //     proxy[key] = mod.new;
      //   } else if (mod.type == "delete") {
      //     delete proxy[key];
      //   }
      // }
      // flush();
    },
  };
};
