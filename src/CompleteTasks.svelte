<script lang="ts">
  import iconCloud from "@ktibow/iconset-material-symbols/cloud";
  import { Icon, Button } from "m3-svelte";
  import { rawAttest as attest } from "monoidentity";
  import EmailInput from "./EmailInput.svelte";
  import { canBackup, type Intent, type ProvisionEnvelope } from "../sdk/src/lib/utils-transport";
  import { encode } from "../sdk/src/lib/utils-base36";
  import { decodeBucket } from "../sdk/src/lib/utils-bucket";
  import { domains } from "./specific-utils";
  import AppBase from "./AppBase.svelte";
  import bucketCreate from "./bucket-create.remote";

  let {
    intents,
    provisionEnvelope,
    submit: confirmSubmit,
    appName,
  }: {
    intents: Intent[];
    provisionEnvelope: ProvisionEnvelope;
    submit: () => void;
    appName: string;
  } = $props();

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

  // try to remove all matching and return if any were
  const eat = (predicate: (i: Intent) => boolean) => {
    let found = false;
    for (let i = intents.length - 1; i >= 0; i--) {
      if (predicate(intents[i])) {
        intents.splice(i, 1);
        found = true;
      }
    }
    return found;
  };

  const getCloudBucket = async () => {
    const saved = localStorage["cloud-bucket"];
    if (saved) {
      return decodeBucket(saved);
    }

    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");
    const login = { email, password };
    const jwt: string = await attest(encode(JSON.stringify(login)), undefined);
    const bucketEncoded = await bucketCreate(jwt);

    localStorage["cloud-bucket"] = bucketEncoded;
    return decodeBucket(bucketEncoded);
  };
  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const method = (e.submitter as HTMLElement | null)?.getAttribute("value");

    if (eat((i) => "loginRecognized" in i)) {
      // if not backup recovery
      if (email && password) {
        const payload = encode(JSON.stringify({ email, password }));
        provisionEnvelope.provisions.push({ createLoginRecognized: payload });
      }
    }
    if (method?.startsWith("local")) {
      if (eat((i) => "storage" in i)) {
        provisionEnvelope.provisions.push({ setup: { method: "localStorage" } });
      }
    } else {
      if (eat((i) => "storage" in i)) {
        const bucket = await getCloudBucket();
        provisionEnvelope.provisions.push({ setup: { method: "cloud", ...bucket } });
      }
    }
    confirmSubmit();
  };
</script>

{#if intents.some((i) => "loginRecognized" in i)}
  <AppBase header="Sign in" subheader="Securely authorize {appName}." {submit}>
    <EmailInput bind:email />
    <input type="password" placeholder="Password" bind:value={password} class="focus-inset" />

    <Button variant="filled" disabled={!maybeRecognized || !email || !password} iconType="left">
      <Icon icon={iconCloud} />
      Sign in with cloud (WIP)
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
        <Icon icon={iconCloud} /> Use cloud storage (WIP)
      </Button>
      <div class="cloud-panel">
        <EmailInput bind:email />
        <input class="focus-inset" type="password" placeholder="Password" bind:value={password} />
        <Button variant="filled" disabled={!maybeRecognized || !email || !password}>
          Continue (WIP)
        </Button>
      </div>
    </details>

    <Button variant="filled" value="local">Use local storage</Button>
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
  }

  details {
    display: contents;
    &:open ~ :global(*) {
      display: none;
    }
    &:not(:open) > :global(summary) {
      margin-bottom: -0.5rem;
    }
  }
  .cloud-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
