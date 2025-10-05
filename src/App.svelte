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
  let submitted = $state(false);
</script>

{#if submitted}
  {#if isTrusted}
    <RedirectGo {provisionEnvelope} {redirectURI} />
  {:else}
    <RedirectPause {provisionEnvelope} {appName} allow={() => (isTrusted = true)} />
  {/if}
{:else if intents.length == 0}
  <Loader />
{:else}
  <CompleteTasks {intents} {provisionEnvelope} submit={() => (submitted = true)} {appName} />
{/if}
