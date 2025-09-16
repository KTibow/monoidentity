<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Scope } from "../../../src/lib.js";
  import { isReady } from "./isready.js";
  let { app, scopes, children }: { app: string; scopes: Scope[]; children: Snippet } = $props();
  const ready = isReady(app, scopes);
</script>

{#if ready}
  {@render children()}
{:else}
  <p style:margin="auto">Setting up</p>
{/if}
