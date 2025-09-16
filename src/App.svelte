<script lang="ts">
  import Form from "./Form.svelte";
</script>

<Form appName="Example App" scopes={["login-recognized", "storage"] as const} />
<!-- <Form appName="Example App" scopes={["storage"] as const} /> -->
