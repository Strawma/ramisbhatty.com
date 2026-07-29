<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/bookclub/favicon.ico" type="image/x-icon" />
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="origin" />
</svelte:head>

{@render children()}
