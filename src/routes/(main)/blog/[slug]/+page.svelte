<script lang="ts">
	import { postContent } from '#lib/content';

	let { data } = $props();
	let Content = $derived(postContent[data.post.slug]);
</script>

<svelte:head>
	<title>{data.post.title} | Ramis Bhatty</title>
	<meta name="description" content={data.post.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/BLOG/{data.post.slug.toUpperCase()}</p>
		{#if data.post.status === 'draft'}
			<p class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800">
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.post.title}</h1>
		<p class="mt-4 text-lg leading-8 text-neutral-700">{data.post.summary}</p>
		{#if data.post.publishedAt || data.post.updatedAt}
			<p class="mt-5 font-mono text-sm text-neutral-500">
				{#if data.post.publishedAt}Published {data.post.publishedAt}{/if}
				{#if data.post.updatedAt}
					· Updated {data.post.updatedAt}{/if}
			</p>
		{/if}
		{#if data.post.topics.length}
			<p class="mt-5 text-sm text-neutral-600">{data.post.topics.join(' · ')}</p>
		{/if}
	</header>

	<div class="mt-8 space-y-8">
		<Content />
	</div>
</article>
