<script lang="ts">
  import iconCloud from "@ktibow/iconset-material-symbols/cloud";
  import { Icon, Button } from "m3-svelte";
  import EmailInput from "./EmailInput.svelte";
  import { canBackup, type Intent, type ProvisionEnvelope } from "../sdk/src/lib/utils-transport";
  import { encode } from "../sdk/src/lib/utils-base36";
  import { domains } from "./specific-utils";
  import AppBase from "./AppBase.svelte";

  let {
    intents,
    provisionEnvelope,
    appName,
  }: { intents: Intent[]; provisionEnvelope: ProvisionEnvelope; appName: string } = $props();

  let email = $state("");
  let password = $state("");

  // email recognition helpers
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

  // remove every matching intent and call action for each removal
  const eat = (predicate: (i: Intent) => boolean, action: () => void) => {
    let idx;
    while ((idx = intents.findIndex(predicate)) != -1) {
      intents.splice(idx, 1);
      action();
    }
  };

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    const method = (e.submitter as HTMLElement | null)?.getAttribute("value");

    if (method?.startsWith("local")) {
      eat(
        (i) => "storage" in i,
        () => {
          provisionEnvelope.provisions.push({ setup: { method: "localStorage" } });
        },
      );
      eat(
        (i) => "loginRecognized" in i,
        () => {
          // if not backup recovery
          if (email && password) {
            const payload = encode(JSON.stringify({ email, password }));
            provisionEnvelope.provisions.push({ createLoginRecognized: payload });
          }
        },
      );
    } else {
      // TODO: cloud
    }
  };
</script>

{#if intents.some((i) => "loginRecognized" in i)}
  <AppBase header="Sign in" subheader="Securely authorize {appName}." {submit}>
    <EmailInput bind:email />
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
      class="m3-font-body-large focus-inset"
    />

    <Button variant="filled" disabled={!maybeRecognized || !email || !password} iconType="left">
      <Icon icon={iconCloud} />
      Sign in with cloud (coming soon)
    </Button>

    <div class="local-row">
      <Button variant="tonal" value="local" disabled={!email || !password}>
        Use local storage
      </Button>

      {#if canBackup && !email && !password}
        <!-- skip sign in -->
        <Button variant="text" value="local-backup">Use local backup</Button>
      {/if}
    </div>
  </AppBase>
{:else if intents.some((i) => "storage" in i)}
  <AppBase header="Set up {appName}" subheader="Get {appName}'s storage working." {submit}>
    <details>
      <Button variant="filled" summary iconType="left">
        <Icon icon={iconCloud} /> Use cloud storage (coming soon)
      </Button>
      <div class="cloud-panel">
        <EmailInput bind:email />
        <input type="password" placeholder="Password (cloud)" bind:value={password} />
        <Button variant="filled" disabled={!maybeRecognized || !email || !password}>
          Continue (cloud not implemented)
        </Button>
      </div>
    </details>

    <div class="local-row">
      <Button variant="filled" value="local">Use local storage</Button>
      {#if canBackup}
        <Button variant="text" value="local-backup">Use local backup</Button>
      {/if}
    </div>
  </AppBase>
{/if}

<style>
  input {
    height: 3rem;
    padding: 0 0.75rem;
    border-radius: var(--m3-util-rounding-medium);
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
    width: 100%;
    box-sizing: border-box;
  }

  .local-row {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 0.5rem;
    align-items: center;
  }

  details {
    display: contents;
    &:not([open]) > :global(summary) {
      margin-bottom: -0.5rem;
    }
  }
  .cloud-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
