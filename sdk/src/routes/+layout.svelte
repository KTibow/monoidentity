<script lang="ts">
  import icon from "../../../icon.svg";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={icon} />
</svelte:head>
{@render children()}
