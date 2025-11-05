<script lang="ts">
  import iconCloud from "@ktibow/iconset-material-symbols/cloud";
  import { Icon, Button } from "m3-svelte";
  import { rawAttest as attest } from "monoidentity";
  import EmailInput from "./EmailInput.svelte";
  import { canBackup, type Intent, type ProvisionEnvelope } from "../sdk/src/lib/utils-transport";
  import { encode } from "../sdk/src/lib/utils-base36";
  import { decodeBucket } from "./specific-utils";
  import { domains } from "./specific-utils";
  import AppBase from "./AppBase.svelte";
  import bucketCreate from "./bucket-create.remote";

  let {
    intents,
    provisionEnvelope,
    appName,
    submissionPromise = $bindable(),
  }: {
    intents: Intent[];
    provisionEnvelope: ProvisionEnvelope;
    appName: string;
    submissionPromise: Promise<void>;
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

  const savedBucket = localStorage["cloud-bucket"];
  const getCloudBucket = async () => {
    if (savedBucket) {
      return decodeBucket(savedBucket);
    }

    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");
    const login = { email, password };
    const jwt: string = await attest(encode(JSON.stringify(login)), undefined);
    const bucketEncoded = await bucketCreate(jwt);

    localStorage["cloud-bucket"] = bucketEncoded;
    return decodeBucket(bucketEncoded);
  };
  const submitLogic = async (method: string | undefined) => {
    if (eat((i) => "loginRecognized" in i)) {
      // if not backup recovery
      if (email && password) {
        const payload = encode(JSON.stringify({ email, password }));
        provisionEnvelope.provisions.push({ createLoginRecognized: payload });
      }
    }
    if (eat((i) => "storage" in i)) {
      if (method?.startsWith("local")) {
        provisionEnvelope.provisions.push({ setup: { method: "localStorage" } });
      } else {
        const bucket = await getCloudBucket();
        provisionEnvelope.provisions.push({ setup: { method: "cloud", ...bucket } });
      }
    }
  };
  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    const method = e.submitter?.getAttribute("value") || undefined;

    submissionPromise = submitLogic(method);
  };
</script>

{#if intents.some((i) => "loginRecognized" in i) && intents.some((i) => "storage" in i)}
  <AppBase header="Sign in" subheader="Securely authorize {appName}." {submit}>
    <EmailInput bind:email />

    {#if maybeRecognized}
      <input type="password" placeholder="Password" bind:value={password} class="focus-inset" />
      <Button variant="filled" disabled={!recognized || !password} iconType="left">
        <Icon icon={iconCloud} />
        Sign in with cloud
      </Button>
      <div class="row">
        <Button variant="tonal" value="local" disabled={!recognized || !password}>
          Use local storage
        </Button>
        {#if canBackup && !email && !password}
          <!-- skip sign in -->
          <Button variant="text" value="local-backup">Use local backup</Button>
        {/if}
      </div>
    {:else}
      <p class="m3-font-body-medium">This app doesn't work with your email.</p>
    {/if}
  </AppBase>
{:else if intents.some((i) => "loginRecognized" in i)}
  <AppBase header="Sign in" subheader="Securely authorize {appName}." {submit}>
    <EmailInput bind:email />

    {#if maybeRecognized}
      <input type="password" placeholder="Password" bind:value={password} class="focus-inset" />
      <Button variant="filled" disabled={!recognized || !password}>Continue</Button>
    {:else}
      <p class="m3-font-body-medium">This app doesn't work with your email.</p>
    {/if}
  </AppBase>
{:else if intents.some((i) => "storage" in i)}
  <AppBase header="Set up {appName}" subheader="Get {appName}'s storage working." {submit}>
    <details>
      <Button variant="filled" summary iconType="left">
        <Icon icon={iconCloud} /> Use cloud storage
      </Button>
      <div class="cloud-panel">
        {#if savedBucket}
          <Button variant="filled">Continue</Button>
        {:else}
          <EmailInput bind:email />
          {#if maybeRecognized}
            <input
              class="focus-inset"
              type="password"
              placeholder="Password"
              bind:value={password}
            />
            <Button variant="filled" disabled={!recognized || !password}>Continue</Button>
          {:else}
            <p class="m3-font-body-medium">Cloud isn't available for your email.</p>
          {/if}
        {/if}
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

  .row {
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
