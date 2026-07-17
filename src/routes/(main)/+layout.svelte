<!-- src/routes/(main)/+layout.svelte -->
<script lang="ts">
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
	<Nav />
	<main class="prose prose-neutral mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
		{@render children()}
	</main>
	<Footer />
</div>
