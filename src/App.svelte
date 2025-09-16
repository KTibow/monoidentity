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
  const submitCloud = (email: string, password: string) => {
    // TODO
  };
  const submitLocalPW = (email: string, password: string) => {
    redirectBack({ storageMethod: "local", email, password });
  };
  const submitLocal = () => {
    redirectBack({ storageMethod: "local" });
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocalPW} {submitLocal} />
