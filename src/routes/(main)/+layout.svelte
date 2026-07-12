<!-- src/routes/(main)/+layout.svelte -->
<script lang="ts">
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
	<Nav />
	<main class="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-12 prose prose-neutral">
		{@render children()}
	</main>
	<Footer />
</div>
