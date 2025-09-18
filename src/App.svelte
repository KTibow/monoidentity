<script lang="ts">
  import Form from "./Form.svelte";
  import type { AppData, Callback, Memory, Scope } from "./lib";

  let {
    appData,
    scopes,
    redirectURI,
  }: {
    appData: AppData;
    scopes: Scope[];
    redirectURI: string;
  } = $props();

  const redirectBack = (data: Callback) => {
    let memory: Partial<Memory> = {};
    if (localStorage.monoidentityMemory) memory = JSON.parse(localStorage.monoidentityMemory);
    // todo: apply data.connect
    localStorage.monoidentityMemory = JSON.stringify(memory);

    const url = new URL(redirectURI);

    const callback = new URLSearchParams();
    callback.set("monoidentitycallback", JSON.stringify(data));
    url.hash = callback.toString();

    window.location.href = url.toString();
  };
  const submitCloud = (email: string, password: string, sharePW: boolean) => {
    // TODO: verify storage, create storage, add password to storage, create a key for using it
  };
  const submitLocal = (create: boolean, email?: string, password?: string) => {
    redirectBack({
      connect: { method: "local", createNew: create },
      fileTasks: undefined // TODO
    });
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocal} />
