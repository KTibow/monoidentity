<script lang="ts">
  import { Icon } from "m3-svelte";
  import { logoMonoidentity } from "./specific-utils";
  import type { Snippet } from "svelte";

  let {
    header,
    subheader,
    submit,
    children,
  }: { header: string; subheader: string; submit?: (e: SubmitEvent) => void; children: Snippet } =
    $props();
</script>

<svelte:element this={submit ? "form" : "div"} class="base" onsubmit={submit}>
  <Icon icon={logoMonoidentity} size={24} style="color:var(--m3c-secondary)" />
  <h1>{header}</h1>
  <p>{subheader}</p>
  <div class="br"></div>
  {@render children()}
</svelte:element>

<style>
  .base {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 25rem;

    background-color: var(--m3c-surface-container-low);
    color: var(--m3c-on-surface-variant);
    padding: 1.5rem;
    border-radius: var(--m3-shape-extra-large);

    > h1 {
      @apply --m3-headline-small;
      color: var(--m3c-on-surface);
    }
    > :global(.br) {
      height: 2rem;
      margin-top: -0.5rem;
    }
  }
</style>
