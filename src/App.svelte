<script lang="ts">
  import type { IntentEnvelope, ProvisionEnvelope } from "../sdk/src/lib/utils-transport";
  import { knownApps } from "./specific-utils";
  import RedirectGo from "./RedirectGo.svelte";
  import RedirectPause from "./RedirectPause.svelte";
  import CompleteTasks from "./CompleteTasks.svelte";
  import Loader from "./Loader.svelte";

  let { intents: _intents, redirectURI }: IntentEnvelope = $props();

  const appData = knownApps[redirectURI];
  const appName = appData || new URL(redirectURI).hostname;
  let intents = $state(_intents);
  let provisionEnvelope: ProvisionEnvelope = $state({ provisions: [] });

  let isTrusted = $state(!!appData || new URL(redirectURI).hostname == "localhost");
  let submissionState: "submitting" | "submitted" | "error" = $state("submitting");
</script>

{#if intents.length == 0}
  {#if submissionState == "submitting"}
    <Loader />
  {:else if submissionState == "error"}
    <p style:margin="auto">Something went wrong</p>
  {:else if isTrusted}
    <RedirectGo {provisionEnvelope} {redirectURI} />
  {:else}
    <RedirectPause {provisionEnvelope} {appName} allow={() => (isTrusted = true)} />
  {/if}
{:else}
  <CompleteTasks {intents} {provisionEnvelope} {appName} bind:submissionState />
{/if}
