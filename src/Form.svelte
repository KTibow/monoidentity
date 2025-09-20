<script lang="ts">
  import iconCloud from "@ktibow/iconset-material-symbols/cloud";
  import iconCable from "@ktibow/iconset-material-symbols/cable-rounded";
  import { Icon, Button } from "m3-svelte";
  import type { Login } from "../sdk/src/lib/utils-login";
  import { scopeDefs, type Scope } from "../sdk/src/lib/utils-scope";
  import { supportBackups, type Memory } from "../sdk/src/lib/utils-callback";
  import { domains } from "./specific-utils";
  import FormEmail from "./FormEmail.svelte";
  // import FormCountdown from "./FormCountdown.svelte";

  let {
    appName,
    scopes,
    // savedMemory,
    submitCloud,
    submitLocal,
  }: {
    appName: string;
    scopes: Scope[];
    // savedMemory: Memory | undefined;
    submitCloud: (login: Login, sharePW: boolean) => void;
    submitLocal: (login?: Login, useBackup?: boolean) => void;
  } = $props();

  let email = $state("");
  let password = $state("");
  let loginScope = $derived(scopes.includes("login-recognized"));
  // let memory = $derived.by(() => {
  //   const memory = savedMemory;
  //   if (!memory) return undefined;
  //   if (scopes.some((s) => scopeDefs[s].files.some((f) => !memory.knownFiles?.includes(f))))
  //     return undefined;
  //   return memory;
  // });
  let recognized = $derived.by(() => {
    const domain = email.split("@")[1];
    return domains.includes(domain);
  });
  let maybeRecognized = $derived.by(() => {
    const domain = email.split("@")[1];
    const tld = domain?.split(".").slice(-1)[0];
    if (!["com", "org", "net", "edu"].includes(tld)) return true;
    return recognized;
  });
  const submit = (e: SubmitEvent) => {
    e.preventDefault();

    const method = e.submitter?.getAttribute("value");
    if (method == "local") {
      submitLocal(email ? { email, password } : undefined);
    } else if (method == "local-backup") {
      submitLocal(undefined, true);
    } else {
      submitCloud({ email, password }, loginScope);
    }
  };
</script>

{#snippet emailpassword()}
  <FormEmail bind:email />
  <input
    type="password"
    placeholder="Password"
    bind:value={password}
    class="m3-font-body-large focus-inset"
  />
{/snippet}
{#snippet localOptions(waitingOnEmailPassword: boolean)}
  <Button variant="tonal" name="method" value="local" disabled={waitingOnEmailPassword}
    >Use local storage</Button
  >
  {#if supportBackups}
    <Button variant="tonal" name="method" value="local-backup">Use local backup</Button>
  {/if}
{/snippet}

<form onsubmit={submit}>
  <Icon icon={iconCable} width="1.5rem" height="1.5rem" />
  {#if loginScope}
    <h1 class="m3-font-headline-small">Sign in</h1>
    <p>Securely authorize {appName}.</p>
  {:else}
    <h1 class="m3-font-headline-small">Set up {appName}</h1>
    <p>Get {appName}'s storage working.</p>
  {/if}
  <div class="spacer"></div>
  {#if loginScope}
    {@render emailpassword()}
    {#if maybeRecognized}
      <Button variant="filled" name="method" value="cloud" iconType="left" disabled={!recognized}>
        <Icon icon={iconCloud} />
        Sign in
      </Button>
      {@render localOptions(!recognized)}
    {:else}
      <p class="m3-font-body-medium">This app doesn't work with your email.</p>
    {/if}
  {:else}
    <details>
      <Button variant="filled" summary iconType="left">
        <Icon icon={iconCloud} />
        Use cloud storage
      </Button>
      {@render emailpassword()}
      {#if maybeRecognized}
        <Button variant="filled" name="method" value="cloud" disabled={!recognized}>
          Continue
        </Button>
      {:else}
        <p class="m3-font-body-medium">Cloud isn't available for your email.</p>
      {/if}
    </details>
    {@render localOptions(false)}
  {/if}
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    margin: auto;
    gap: 0.5rem;
    width: 100%;
    max-width: 25rem;

    background-color: rgb(var(--m3-scheme-surface-container-low));
    color: rgb(var(--m3-scheme-on-surface-variant));
    padding: 1.5rem;
    border-radius: var(--m3-util-rounding-extra-large);
  }
  form > :global(svg) {
    color: rgb(var(--m3-scheme-primary));
  }
  h1 {
    color: rgb(var(--m3-scheme-on-surface));
  }
  .spacer {
    margin-top: -0.5rem;
    height: 2rem;
  }
  form :global(input) {
    height: 3rem;
    padding: 0 0.75rem;
    border-radius: var(--m3-util-rounding-medium);
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
  }

  details {
    display: contents;
    &::details-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    /* todo: once chromebooks use chrome >132 use :open */
    &[open] ~ :global(*) {
      display: none;
    }
    &:not([open]) > :global(summary) {
      margin-bottom: -0.5rem;
    }
  }
</style>
