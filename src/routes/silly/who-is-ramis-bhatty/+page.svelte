<script lang="ts">
	import { resolve } from '$app/paths';
	import { pageContent } from '#lib/content';
	import { nav, site } from '#lib/data/config';

	let { data } = $props();
	const Content = pageContent['who-is-ramis-bhatty'];
</script>

<svelte:head>
	<title>{data.page.title} | A Comprehensive Biography</title>
	<link rel="icon" href="/silly/favicon.ico" />
	<link rel="canonical" href={`${site.origin}/silly/who-is-ramis-bhatty`} />
	<meta name="description" content={data.page.description} />
</svelte:head>

<main
	class="min-h-screen bg-[#000080] px-3 py-6 font-['pixel-sans',cursive] text-black sm:px-6"
	style="background-image: repeating-linear-gradient(45deg, #000080 0, #000080 18px, #400080 18px, #400080 36px);"
>
	<article
		class="mx-auto max-w-4xl border-4 border-black bg-[#c0c0c0] p-3 shadow-[8px_8px_0_#000] sm:p-6"
	>
		<nav aria-label="Dubious biography navigation" class="mb-4 flex flex-wrap gap-3 text-sm">
			<a href={resolve(nav.silly)} class="retro-btn inline-block px-3 py-2 text-blue-800 underline">
				← Silly homepage
			</a>
			<a href={resolve(nav.home)} class="retro-btn inline-block px-3 py-2 text-blue-800 underline">
				Suspiciously normal website
			</a>
		</nav>

		<header class="border-4 border-black bg-[#ffff00] p-4 text-center shadow-[4px_4px_0_#000]">
			<p class="mb-2 font-bold text-red-700">THE DEFINITIVE RECORD</p>
			<h1 class="text-3xl font-bold uppercase sm:text-5xl">{data.page.title}</h1>
			<p class="mt-4 text-lg font-bold">{data.page.introduction}</p>
		</header>

		<section class="dubious-copy retro-panel mt-6 bg-white p-4 sm:p-6">
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

	.dubious-copy :global(blockquote p:first-child) {
		margin-top: 0;
	}
</style>
