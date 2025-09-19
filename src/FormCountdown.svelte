<script lang="ts">
  import { Layer } from "m3-svelte";
  import { onMount } from "svelte";

  let { method, run, cancel }: { method: string; run: () => void; cancel: () => void } = $props();
  let countdown = $state(2);

  onMount(() => {
    const interval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(interval);
        run();
      }
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="first">{method} in {countdown}.</div>
<button class="second m3-font-label-large" onclick={cancel}>
  <Layer />
  Cancel
</button>

<style>
  .first,
  .second {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--m3-util-rounding-small);
    position: relative;
    &.first {
      padding-block: 1rem;
      border-start-start-radius: var(--m3-util-rounding-large);
      border-start-end-radius: var(--m3-util-rounding-large);
      background-color: rgb(var(--m3-scheme-surface-container-high));
      color: rgb(var(--m3-scheme-on-surface));
    }
    &.second {
      height: 2.5rem;
      border-end-start-radius: var(--m3-util-rounding-large);
      border-end-end-radius: var(--m3-util-rounding-large);
      background-color: rgb(var(--m3-scheme-secondary-container));
      color: rgb(var(--m3-scheme-on-secondary-container));
    }
  }
</style>
