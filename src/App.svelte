<script lang="ts">
  import Form from "./Form.svelte";
  import type { AppData, Callback, Scope } from "./lib";

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
    const url = new URL(redirectURI);

    const callback = new URLSearchParams();
    callback.set("monoidentitycallback", JSON.stringify(data));
    url.hash = callback.toString();

    window.location.href = url.toString();
  };
  const submitCloud = (email: string, password: string, sharePW: boolean) => {
    localStorage.lastUsed = "cloud";
    // TODO: verify storage, create storage, add password to storage, create a key for using it
  };
  const submitLocal = (create: boolean, email?: string, password?: string) => {
    localStorage.lastUsed = "local";
    redirectBack({
      storageMethod: "local",
      localCreateTask: create ? { email, password } : undefined,
    });
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocal} />
