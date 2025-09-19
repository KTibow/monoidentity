<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Scope } from "../../../src/lib.js";
  import { trackReady } from "./trackready.js";

  let { app, scopes, children }: { app: string; scopes: Scope[]; children: Snippet } = $props();

  let ready = $state(false);
  trackReady(app, scopes, () => (ready = true));
</script>

{#if ready}
  {@render children()}
{:else}
  <p style:margin="auto">Setting up</p>
{/if}
