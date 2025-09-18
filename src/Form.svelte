<script lang="ts">
  import iconCloud from "@ktibow/iconset-material-symbols/cloud";
  import iconCable from "@ktibow/iconset-material-symbols/cable-rounded";
  import { Icon, Button } from "m3-svelte";
  import { domains, scopeDefs, type Memory, type Scope } from "./lib";
  import FormEmail from "./FormEmail.svelte";
  import FormLocalCountdown from "./FormLocalCountdown.svelte";

  let {
    appName,
    scopes,
    savedMemory,
    submitCloud,
    submitLocal,
  }: {
    appName: string;
    scopes: Scope[];
    savedMemory: Memory | undefined;
    submitCloud: (email: string, password: string, sharePW: boolean) => void;
    submitLocal: (create: boolean, email?: string, password?: string) => void;
  } = $props();

  let email = $state("");
  let password = $state("");
  let loginScope = $derived(scopes.includes("login-recognized"));
  let memory = $derived.by(() => {
    const memory = savedMemory;
    if (!memory) return undefined;
    if (scopes.some((s) => scopeDefs[s].files.some((f) => !memory.knownFiles?.includes(f))))
      return undefined;
    return memory;
  });
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
    if (method == "local-create") {
      submitLocal(true, email, password);
    } else if (method == "local") {
      submitLocal(false);
    } else {
      submitCloud(email, password, loginScope);
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
  {#if memory?.method == "local"}
    <FormLocalCountdown
      run={() => submitLocal(false)}
      cancel={() => {
        memory = undefined;
        delete localStorage.monoidentityMemory;
      }}
    />
  {:else if loginScope}
    {@render emailpassword()}
    {#if maybeRecognized}
      <Button variant="filled" name="method" value="cloud" iconType="left" disabled={!recognized}>
        <Icon icon={iconCloud} />
        Sign in
      </Button>
      <Button variant="tonal" name="method" value="local-create" disabled={!recognized}
        >Set up local storage</Button
      >
      <Button variant="tonal" name="method" value="local">Use preexisting local storage</Button>
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
    <Button variant="tonal" name="method" value="local-create">Set up local storage</Button>
    <Button variant="tonal" name="method" value="local">Use preexisting local storage</Button>
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
