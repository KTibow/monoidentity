<script lang="ts">
  import Monoidentity from "$lib/Monoidentity.svelte";
  import icon from "../../../icon.svg";
  import "./app.css";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={icon} />
</svelte:head>

<Monoidentity app="monoidentity-demo" getSyncStrategy={() => undefined}>
  {@render children()}
</Monoidentity>
