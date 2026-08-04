<script lang="ts">
	import { interestContent } from '#lib/content';

	let { data } = $props();
	let Content = $derived(interestContent[data.category.slug]);
</script>

<svelte:head>
	<title>{data.category.title} | Interests | Ramis Bhatty</title>
	<meta name="description" content={data.category.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">
			/INTERESTS/{data.category.slug.toUpperCase()}
		</p>
		{#if data.category.status === 'draft'}
			<p class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800">
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.category.title}</h1>
		<p class="mt-5 text-lg leading-8 text-neutral-700">{data.category.summary}</p>
	</header>

	<div class="mt-8"><Content /></div>
</article>
