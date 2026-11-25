<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { pageContent } from '#lib/content.ts';
	import { nav } from '#lib/data/config.ts';
	import { SILLY_HORROR_STORAGE_KEY } from '../silly-horror-data';
	import { sillyTheme } from '../silly-theme.svelte';
	import '../silly-horror.css';

	let { data } = $props();
	const Content = pageContent['who-is-ramis-bhatty'];

	onMount(() => {
		sillyTheme.syncFromStorage();
		const handleStorage = (event: StorageEvent) => {
			if (event.key === SILLY_HORROR_STORAGE_KEY || event.key === null) {
				sillyTheme.syncFromStorage();
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	});
</script>

<svelte:head>
	<title>{data.page.title} | A Comprehensive Biography</title>
	<link rel="icon" href="/silly/favicon.ico" />
	<meta name="description" content={data.page.description} />
</svelte:head>

<main
	class="min-h-screen px-3 py-6 font-['pixel-sans',cursive] sm:px-6"
	class:text-black={!sillyTheme.isHorror}
	class:text-zinc-200={sillyTheme.isHorror}
	class:silly-horror={sillyTheme.isHorror}
	data-silly-mode={sillyTheme.isHorror ? 'horror' : 'normal'}
	style="color-scheme: light; background-color: {sillyTheme.isHorror
		? '#050506'
		: '#000080'}; background-image: {sillyTheme.isHorror
		? 'repeating-linear-gradient(45deg, #050506 0, #050506 18px, #190407 18px, #190407 36px)'
		: 'repeating-linear-gradient(45deg, #000080 0, #000080 18px, #400080 18px, #400080 36px)'};"
>
	{#if sillyTheme.isHorror}
		<div class="silly-crt-overlay" aria-hidden="true"></div>
	{/if}

	<article
		class="mx-auto max-w-4xl p-3 sm:p-6 {sillyTheme.isHorror
			? 'silly-glitch-shell border-4 border-red-900 bg-[#0b0b0d] shadow-[8px_8px_0_#000]'
			: 'border-4 border-black bg-[#c0c0c0] shadow-[8px_8px_0_#000]'}"
	>
		<nav aria-label="Dubious biography navigation" class="mb-4 flex flex-wrap gap-3 text-sm">
			<a
				href={resolve(nav.silly)}
				class="inline-block px-3 py-2 underline {sillyTheme.isHorror
					? 'silly-horror-btn text-red-400'
					: 'retro-btn text-blue-800'}"
			>
				← Silly homepage
			</a>
			<a
				href={resolve(nav.home)}
				class="inline-block px-3 py-2 underline {sillyTheme.isHorror
					? 'silly-horror-btn text-red-400'
					: 'retro-btn text-blue-800'}"
			>
				Suspiciously normal website
			</a>
			<button
				type="button"
				aria-pressed={sillyTheme.isHorror}
				onclick={() => sillyTheme.toggle()}
				class="ml-auto inline-block px-3 py-2 {sillyTheme.isHorror
					? 'silly-horror-btn text-zinc-100'
					: 'retro-btn text-black'}"
			>
				{sillyTheme.isHorror ? '☀ EXIT BROADCAST' : '☾ DARK MODE'}
			</button>
		</nav>

		<header
			class="p-4 text-center shadow-[4px_4px_0_#000] {sillyTheme.isHorror
				? 'border-4 border-red-900 bg-[#140709] text-zinc-100'
				: 'border-4 border-black bg-[#ffff00]'}"
		>
			<p class="mb-2 font-bold {sillyTheme.isHorror ? 'text-red-400' : 'text-red-700'}">
				{sillyTheme.isHorror ? 'CASE FILE 04 // SIGNAL RECOVERED' : 'THE DEFINITIVE RECORD'}
			</p>
			<h1
				class="text-3xl font-bold uppercase sm:text-5xl {sillyTheme.isHorror
					? 'silly-phosphor-text'
					: ''}"
			>
				{data.page.title}
			</h1>
			<p class="mt-4 text-lg font-bold {sillyTheme.isHorror ? 'text-zinc-300' : ''}">
				{data.page.introduction}
			</p>
		</header>

		{#if sillyTheme.isHorror}
			<p
				class="mt-4 border-2 border-red-900 bg-black px-3 py-2 font-mono text-xs text-red-400"
				role="note"
			>
				NOTICE: Tape degradation detected on sectors 01–06. Names and dates below remain
				uncorroborated.
			</p>
		{/if}

		<section
			class="dubious-copy mt-6 p-4 sm:p-6 {sillyTheme.isHorror
				? 'silly-horror-panel'
				: 'retro-panel bg-white'}"
		>
			<Content />
		</section>
	</article>
</main>

<style>
	@font-face {
		font-family: 'pixel-sans';
		src: url('../../../lib/assets/fonts/pixel-comic-sans.ttf') format('truetype');
	}

	.dubious-copy :global(h2) {
		margin-top: 2rem;
		border: 2px solid black;
		background: #008080;
		padding: 0.5rem 0.75rem;
		color: white;
		font-size: 1.5rem;
		font-weight: 700;
		text-decoration: underline;
		box-shadow: 3px 3px 0 #000;
	}

	.dubious-copy :global(h2:first-child) {
		margin-top: 0;
	}

	.dubious-copy :global(h2:nth-of-type(2)),
	.dubious-copy :global(h2:nth-of-type(5)) {
		background: #800080;
	}

	.dubious-copy :global(h2:nth-of-type(3)),
	.dubious-copy :global(h2:nth-of-type(6)) {
		background: #006000;
	}

	.silly-horror .dubious-copy :global(h2) {
		border-color: #7f1d1d;
		background: #27090d;
		color: #fca5a5;
	}

	.silly-horror .dubious-copy :global(h2:nth-of-type(2)),
	.silly-horror .dubious-copy :global(h2:nth-of-type(5)) {
		background: #18181b;
		color: #e4e4e7;
	}

	.silly-horror .dubious-copy :global(h2:nth-of-type(3)),
	.silly-horror .dubious-copy :global(h2:nth-of-type(6)) {
		background: #1c1917;
		color: #fda4af;
	}

	.dubious-copy :global(h3) {
		margin-top: 1.25rem;
		font-size: 1.125rem;
		font-weight: 700;
	}

	.dubious-copy :global(p) {
		margin-top: 0.75rem;
	}

	.dubious-copy :global(ul) {
		margin-top: 0.75rem;
		list-style-type: square;
		padding-left: 1.5rem;
	}

	.dubious-copy :global(li + li) {
		margin-top: 0.5rem;
	}

	.dubious-copy :global(blockquote) {
		margin-top: 2rem;
		border: 4px solid black;
		background: black;
		padding: 1rem;
		text-align: center;
		color: #86efac;
	}

	.silly-horror .dubious-copy :global(blockquote) {
		border-color: #7f1d1d;
		color: #f87171;
	}

	.dubious-copy :global(blockquote p:first-child) {
		margin-top: 0;
	}
</style>
