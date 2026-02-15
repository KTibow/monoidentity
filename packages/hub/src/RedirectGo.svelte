<script lang="ts">
  import type { ProvisionEnvelope } from "../../sdk/src/lib/utils-transport";
  import Loader from "./Loader.svelte";

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

<Loader />
