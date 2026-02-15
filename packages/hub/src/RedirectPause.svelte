<script lang="ts">
  import { Button } from "m3-svelte";
  import type { ProvisionEnvelope } from "../../sdk/src/lib/utils-transport";
  import AppBase from "./AppBase.svelte";

  let {
    provisionEnvelope,
    appName,
    allow,
  }: { provisionEnvelope: ProvisionEnvelope; appName: string; allow: () => void } = $props();
  let isDenied = $state(false);
  const deny = () => (isDenied = true);

  const formatter = new Intl.ListFormat("en");
  let permissions = $derived(
    provisionEnvelope.provisions.map((p) => {
      if ("setup" in p) return "set up storage";
      if ("createLoginRecognized" in p) return "use your login";
      return "???";
    }),
  );
</script>

{#if !isDenied}
  <AppBase header="Authorize {appName}?" subheader="Let it {formatter.format(permissions)}?">
    <Button variant="filled" onclick={allow}>Authorize</Button>
    <Button variant="text" onclick={deny}>Deny</Button>
  </AppBase>
{:else}
  <p>You denied this auth request.</p>
{/if}
