<script lang="ts">
  import Form from "./Form.svelte";
  import { rememberCallback, type AppData, type Callback, type Memory, type Scope } from "./lib";

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
  const submitCloud = (email: string, password: string, sharePW: boolean) => {
    // TODO: verify storage, create storage, add password to storage, create a key for using it
  };
  const submitFile = (create: boolean, email?: string, password?: string) => {
    redirectBack({
      connect: { method: "file", createNew: create },
      fileTasks: undefined, // TODO
    });
  };
  const submitLocal = (email?: string, password?: string) => {
    redirectBack({
      connect: { method: "localStorage" },
      fileTasks: undefined, // TODO
    });
  };
</script>

<Form appName={appData.name} {scopes} {savedMemory} {submitCloud} {submitFile} {submitLocal} />
