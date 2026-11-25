<script lang="ts">
	import { resolve } from '$app/paths';
	import PageConnections from '#lib/components/main/PageConnections.svelte';
	import { blogContent, formatIsoDate } from '#lib/content.ts';

	let { data } = $props();
	let Content = $derived(blogContent[data.post.slug]);
</script>

<svelte:head>
	<title>{data.post.title} | Ramis Bhatty</title>
	<meta name="description" content={data.post.summary} />
</svelte:head>

<article>
	<header
		class="not-prose border-b border-neutral-300 pb-8 text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
	>
		<p class="font-mono text-sm text-neutral-500 dark:text-neutral-400">
			/BLOG/{data.post.slug.toUpperCase()}
		</p>
		{#if data.post.status === 'draft'}
			<p
				class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800 dark:border-amber-500 dark:text-amber-300"
			>
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.post.title}</h1>
		<p class="mt-4 text-lg leading-8 text-neutral-700 dark:text-neutral-300">
			{data.post.summary}
		</p>
		{#if data.post.publishedAt || data.post.updatedAt}
			<p class="mt-5 font-mono text-sm text-neutral-500 dark:text-neutral-400">
				{#if data.post.publishedAt}Published {formatIsoDate(data.post.publishedAt)}{/if}
				{#if data.post.updatedAt}
					{#if data.post.publishedAt}
						·
					{/if}Updated {formatIsoDate(data.post.updatedAt)}
				{/if}
			</p>
		{/if}
		{#if data.post.topics.length}
			<p class="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
				{data.post.topics.join(' · ')}
			</p>
		{/if}
	</header>

	<div class="mt-8 space-y-8">
		<Content />
	</div>

	<PageConnections
		related={data.connections.related}
		mentionedBy={data.connections.mentionedBy}
		parent={{ label: 'Blog', href: resolve('blog') }}
	/>
</article>
