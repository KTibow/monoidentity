<script lang="ts">
  import Form from "./Form.svelte";
  import { encode } from "../sdk/src/lib/utils-base36";
  import type { Scope } from "../sdk/src/lib/utils-scope";
  import { type Login, type Callback } from "../sdk/src/lib/utils-callback";
  import type { AppData } from "./specific-utils";

  let {
    appData,
    scopes,
    redirectURI,
  }: {
    appData: AppData;
    scopes: Scope[];
    redirectURI: string;
  } = $props();

  const redirectBack = (cb: Callback) => {
    const url = new URL(redirectURI);

    const callback = new URLSearchParams();
    callback.set("monoidentitycallback", JSON.stringify(cb));
    url.hash = callback.toString();

    window.location.href = url.toString();
  };
  const genFileTasks = (login?: Login) => {
    const tasks: Callback = [];
    if (login) {
      tasks.push({ createLoginRecognized: encode(JSON.stringify(login)) });
    }
    return tasks;
  };
  const submitCloud = (login: Login, sharePW: boolean) => {
    // TODO: verify storage, create storage, add password to storage, create a key for using it
  };
  const submitLocal = (login?: Login) => {
    redirectBack([{ setup: { method: "localStorage" } }, ...genFileTasks(login)]);
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocal} />
