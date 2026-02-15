<script lang="ts">
  import type { IntentEnvelope, ProvisionEnvelope } from "../../sdk/src/lib/utils-transport";
  import { knownApps } from "./specific-utils";
  import RedirectGo from "./RedirectGo.svelte";
  import RedirectPause from "./RedirectPause.svelte";
  import CompleteTasks from "./CompleteTasks.svelte";
  import Loader from "./Loader.svelte";

  let { intents: _intents, redirectURI: _redirectURI }: IntentEnvelope = $props();
  // svelte-ignore state_referenced_locally
  const intents = $state(_intents);
  // svelte-ignore state_referenced_locally
  const redirectURI = _redirectURI;

  const appData = knownApps[redirectURI];
  const appName = appData || new URL(redirectURI).hostname;
  let provisionEnvelope: ProvisionEnvelope = $state({ provisions: [] });

  let isTrusted = $state(!!appData || new URL(redirectURI).hostname == "localhost");
  let submissionPromise: Promise<void> = $state(Promise.resolve());
</script>

{#if intents.length == 0}
  {#await submissionPromise}
    <Loader />
  {:then}
    {#if isTrusted}
      <RedirectGo {provisionEnvelope} {redirectURI} />
    {:else}
      <RedirectPause {provisionEnvelope} {appName} allow={() => (isTrusted = true)} />
    {/if}
  {:catch e}
    <p>Something went wrong</p>
    {#if e instanceof Error}
      <pre>{e.message}</pre>
    {/if}
  {/await}
{:else}
  <CompleteTasks {intents} {provisionEnvelope} {appName} bind:submissionPromise />
{/if}
