<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/bookclub/favicon.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}
