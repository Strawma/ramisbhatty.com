<!-- src/routes/(main)/+layout.svelte -->
<script lang="ts">
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	import { page } from '$app/state';
	import {
		getStoredTheme,
		mainTheme,
		resetDocumentTheme,
		THEME_STORAGE_KEY
	} from '#lib/theme.svelte.ts';
	let { children } = $props();

	$effect.pre(() => {
		// Scope dark theme state to the main layout so fixed-palette routes stay light across client navigation.
		mainTheme.syncFromPreference();

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleMediaChange = () => {
			if (!getStoredTheme()) {
				mainTheme.syncFromPreference();
			}
		};
		const handleStorage = (event: StorageEvent) => {
			if (event.key === THEME_STORAGE_KEY || event.key === null) {
				mainTheme.syncFromPreference();
			}
		};

		mediaQuery.addEventListener('change', handleMediaChange);
		window.addEventListener('storage', handleStorage);

		return () => {
			mediaQuery.removeEventListener('change', handleMediaChange);
			window.removeEventListener('storage', handleStorage);
			resetDocumentTheme();
		};
	});
</script>

<div
	class="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 print:bg-white print:text-black"
>
	<a
		href="#main-content"
		class="sr-only z-50 bg-neutral-900 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 dark:bg-neutral-100 dark:text-neutral-900 print:hidden"
	>
		Skip to main content
	</a>
	<Nav />
	<main
		id="main-content"
		tabindex="-1"
		class="prose prose-neutral dark:prose-invert mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 print:max-w-none print:px-0 print:py-0"
		class:cv-page={page.url.pathname === '/cv'}
	>
		{@render children()}
	</main>
	<Footer />
</div>
