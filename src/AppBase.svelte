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
  <Icon icon={logoMonoidentity} size={24} style="color:rgb(var(--m3-scheme-secondary))" />
  <h1 class="m3-font-headline-small">{header}</h1>
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

    background-color: rgb(var(--m3-scheme-surface-container-low));
    color: rgb(var(--m3-scheme-on-surface-variant));
    padding: 1.5rem;
    border-radius: var(--m3-util-rounding-extra-large);

    > h1 {
      color: rgb(var(--m3-scheme-on-surface));
    }
    > :global(.br) {
      height: 2rem;
      margin-top: -0.5rem;
    }
  }
</style>
