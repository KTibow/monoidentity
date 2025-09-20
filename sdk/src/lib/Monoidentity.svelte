<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Scope } from "./utils-scope.js";
  import { trackReady } from "./trackready.js";

  let { app, scopes, children }: { app: string; scopes: Scope[]; children: Snippet } = $props();

  let ready = $state(false);
  let backup: (() => void) | undefined = $state();
  trackReady(
    app,
    scopes,
    (callback) => {
      backup = () => {
        callback();
        backup = undefined;
      };
    },
    () => (ready = true),
  );
</script>

{#snippet backupUI(yes: () => void, no: () => void)}
  <p>Avoid reconfiguration with a backup folder.</p>
  <div class="buttons">
    <button class="primary" onclick={yes}>Connect</button>
    <button onclick={no}>Skip</button>
  </div>
{/snippet}

{#if ready}
  {@render children()}
  {#if backup}
    <div class="backup toast">
      {@render backupUI(backup, () => (backup = undefined))}
    </div>
  {/if}
{:else if backup}
  <div class="backup center">
    {@render backupUI(backup, () => (backup = undefined))}
  </div>
{:else}
  <p class="center">Setting up</p>
{/if}

<style>
  .backup {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    background-color: light-dark(#000, #fff);
    color: light-dark(#fff, #000);
    line-height: 1;
    padding: 0.75rem;
    border-radius: 1.5rem;

    > .buttons {
      display: flex;
      gap: 0.5rem;
      > button {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        height: 2rem;
        border-radius: 0.75rem;
        &.primary {
          background-color: light-dark(#fff, #000);
          color: light-dark(#000, #fff);
        }
        border: none;
        font: inherit;
        cursor: pointer;
      }
    }
  }
  .toast {
    position: fixed;
    right: 1rem;
    top: 1rem;
    z-index: 1000;
  }
  .center {
    margin: auto;
  }
</style>
