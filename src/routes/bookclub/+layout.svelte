<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/bookclub/favicon.ico" type="image/x-icon" />
</svelte:head>

{@render children()}
