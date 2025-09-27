<script lang="ts">
  import { onward } from "kreations";
  import { Icon } from "m3-svelte";
  import type { ProvisionEnvelope } from "../sdk/src/lib/utils-transport";

  let {
    provisionEnvelope,
    redirectURI,
  }: { provisionEnvelope: ProvisionEnvelope; redirectURI: string } = $props();

  const url = new URL(redirectURI);
  const params = new URLSearchParams();
  params.set("monoidentitycallback", JSON.stringify(provisionEnvelope));
  url.hash = params.toString();
  window.location.href = url.toString();
</script>

<Icon icon={onward} size={48} style="margin:auto" />
