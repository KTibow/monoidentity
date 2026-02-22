<script lang="ts">
  import icon from "../../../hub/icon.svg";
  import "./app.css";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={icon} />
</svelte:head>

{@render children()}
