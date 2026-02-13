<script lang="ts">
  import { onDestroy, type Snippet } from "svelte";
  import { readyUp } from "./readyup.js";
  import type { Intent } from "./utils-transport.js";
  import type { SyncStrategy } from "./storage/utils-storage.js";

  let {
    app,
    intents,
    getSyncStrategy,
    children,
  }: {
    app: string;
    intents?: Intent[];
    getSyncStrategy: (path: string) => SyncStrategy;
    children: Snippet;
  } = $props();

  const aborter = new AbortController();
  onDestroy(() => {
    aborter.abort();
  });

  let backup: (() => void) | undefined = $state();
  readyUp(
    app,
    intents || [],
    getSyncStrategy,
    aborter.signal,
    (startBackup) =>
      (backup = () => {
        startBackup();
        backup = undefined;
      }),
  );
</script>

{#snippet backupUI(yes: () => void, no: () => void)}
  <p>Avoid reconfiguration with a backup folder.</p>
  <button onclick={no}>Skip</button>
  <button class="primary" onclick={yes}>Connect</button>
{/snippet}

{@render children()}
{#if backup}
  <div class="backup toast">
    {@render backupUI(backup, () => (backup = undefined))}
  </div>
{/if}

<style>
  .backup {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    line-height: 1;

    > * {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 3rem;
      margin: 0;
      padding-inline: 0.5rem;
      border-radius: 0.5rem;
      border: none;
      font: inherit;
      &:first-child {
        border-start-start-radius: 1.5rem;
        border-start-end-radius: 1.5rem;
      }
      &:last-child {
        border-end-start-radius: 1.5rem;
        border-end-end-radius: 1.5rem;
      }
      background-color: light-dark(#fff, #000);
      color: light-dark(#000, #fff);
    }
    > button {
      cursor: pointer;
    }
    > .primary {
      background-color: light-dark(#000, #fff);
      color: light-dark(#fff, #000);
    }
  }
  .toast {
    position: fixed;
    right: 1rem;
    top: 1rem;
    z-index: 1000;
  }
</style>
