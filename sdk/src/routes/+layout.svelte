<script lang="ts">
  import Monoidentity from "$lib/Monoidentity.svelte";
  import icon from "../../../icon.svg";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={icon} />
</svelte:head>

<Monoidentity app="monoidentity-demo" scopes={["storage"]}>
  {@render children()}
</Monoidentity>
