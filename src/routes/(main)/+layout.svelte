<!-- src/routes/(main)/+layout.svelte -->
<script lang="ts">
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
	<a
		href="#main-content"
		class="sr-only z-50 bg-neutral-900 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
	>
		Skip to main content
	</a>
	<Nav />
	<main
		id="main-content"
		tabindex="-1"
		class="prose prose-neutral mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12"
	>
		{@render children()}
	</main>
	<Footer />
</div>
