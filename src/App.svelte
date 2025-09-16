<script lang="ts">
  import Form from "./Form.svelte";
  import type { AppData, Scope } from "./lib";

  let {
    appData,
    scopes,
    redirectURI,
  }: {
    appData: AppData;
    scopes: Scope[];
    redirectURI: string;
  } = $props();

  const redirectBack = (data: unknown) => {
    const url = new URL(redirectURI);
    url.hash = `monoidentity=${encodeURIComponent(JSON.stringify(data))}`;
    window.location.href = url.toString();
  };
  const submitCloud = (email: string, password: string) => {
    // TODO
  };
  const submitLocalPW = (email: string, password: string) => {
    redirectBack({ method: "local", email, password });
  };
  const submitLocal = () => {
    redirectBack({ method: "local" });
  };
</script>

<Form appName={appData.name} {scopes} {submitCloud} {submitLocalPW} {submitLocal} />
