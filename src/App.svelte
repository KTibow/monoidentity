<script lang="ts">
  import type { IntentEnvelope, ProvisionEnvelope } from "../sdk/src/lib/utils-transport";
  import { knownApps } from "./specific-utils";
  import RedirectGo from "./RedirectGo.svelte";
  import RedirectPause from "./RedirectPause.svelte";
  import CompleteTasks from "./CompleteTasks.svelte";

  let { intents: _intents, redirectURI }: IntentEnvelope = $props();

  const appData = knownApps[redirectURI];
  const appName = appData || new URL(redirectURI).hostname;
  let intents = $state(_intents);
  let provisionEnvelope: ProvisionEnvelope = $state({ provisions: [] });
  let canProvision = $state(!!appData || new URL(redirectURI).hostname == "localhost");
</script>

{#if intents.length == 0 && canProvision}
  <RedirectGo {provisionEnvelope} {redirectURI} />
{:else if intents.length == 0}
  <RedirectPause {provisionEnvelope} {appName} allow={() => (canProvision = true)} />
{:else if intents.some((t) => "storage" in t)}
  <CompleteTasks {intents} {provisionEnvelope} {appName} />
{/if}
