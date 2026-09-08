<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="canonical" href="https://ramisbhatty.com{page.url.pathname}" />
</svelte:head>

{@render children()}
