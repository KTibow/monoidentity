<script lang="ts">
  import Form from "./Form.svelte";
  import { encode, type Login } from "../sdk/src/lib/utils-login";
  import type { Scope } from "../sdk/src/lib/utils-scope";
  import { rememberCallback, type Callback, type Memory } from "../sdk/src/lib/utils-callback";
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

  const savedMemory = localStorage.monoidentityMemory
    ? (JSON.parse(localStorage.monoidentityMemory) as Memory)
    : undefined;
  const redirectBack = (data: Callback) => {
    const memory = rememberCallback(data, savedMemory);
    localStorage.monoidentityMemory = JSON.stringify(memory);

    const url = new URL(redirectURI);

    const callback = new URLSearchParams();
    callback.set("monoidentitycallback", JSON.stringify(data));
    url.hash = callback.toString();

    window.location.href = url.toString();
  };
  const genFileTasks = (login?: Login) => {
    if (!login) return undefined;
    return { ".core/login.encjson": encode(JSON.stringify(login)) };
  };
  const submitCloud = (login: Login, sharePW: boolean) => {
    // TODO: verify storage, create storage, add password to storage, create a key for using it
  };
  const submitLocal = (login?: Login) => {
    redirectBack({
      scopes,
      connect: { method: "localStorage" },
      fileTasks: genFileTasks(login),
    });
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocal} />
