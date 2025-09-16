<script lang="ts">
  import iconCable from "@ktibow/iconset-material-symbols/cable-rounded";
  import { Icon, Button } from "m3-svelte";
  import { domains, type Scope } from "./lib";
  import FormEmail from "./FormEmail.svelte";

  let {
    appName,
    scopes,
  }: {
    appName: string;
    scopes: Scope[];
  } = $props();

  let email = $state("");
  let password = $state("");
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
  const submit = (e: Event) => {
    e.preventDefault();
    // TODO: finishing etc
  };
</script>

{#snippet emailpassword(required: boolean)}
  <FormEmail {required} bind:email />
  <input
    type="password"
    placeholder="Password"
    {required}
    bind:value={password}
    class="m3-font-body-large focus-inset"
  />
{/snippet}

<form onsubmit={submit}>
  <Icon icon={iconCable} width="1.5rem" height="1.5rem" />
  {#if scopes.includes("login-recognized")}
    <h1 class="m3-font-headline-small">Sign in</h1>
    <p>Securely authorize {appName}.</p>
  {:else}
    <h1 class="m3-font-headline-small">Set up {appName}</h1>
    <p>Get {appName}'s storage working.</p>
  {/if}
  <div class="spacer"></div>
  {#if scopes.includes("login-recognized")}
    {@render emailpassword(true)}
    {#if maybeRecognized}
      <Button variant="filled" name="method" value="cloud" disabled={!recognized}>Sign in</Button>
      <Button variant="tonal" name="method" value="local" disabled={!recognized}
        >Sign in locally</Button
      >
    {:else}
      <p class="m3-font-body-medium">Cloud isn't available for your email.</p>
    {/if}
  {:else}
    <details>
      <Button variant="tonal" summary>Use cloud storage</Button>
      {@render emailpassword(false)}
      {#if maybeRecognized}
        <Button variant="filled" name="method" value="cloud" disabled={!recognized}>
          Continue
        </Button>
      {:else}
        <p class="m3-font-body-medium">Cloud isn't available for your email.</p>
      {/if}
    </details>
    <Button variant="tonal" name="method" value="local">Use local storage</Button>
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
    &:open + :global(*) {
      display: none;
    }
    &:not(:open) > :global(summary) {
      margin-bottom: -0.5rem;
    }
  }
</style>
