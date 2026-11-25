<script lang="ts">
	import { resolve } from '$app/paths';
	import EntryList from '#lib/components/main/EntryList.svelte';
	import { formatIsoDate, pageContent } from '#lib/content.ts';

	let { data } = $props();
	const Content = pageContent.blog;
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
	{#if !data.hasPublishedPosts}
		<meta name="robots" content="noindex, follow" />
	{:else}
		<link
			rel="alternate"
			type="application/rss+xml"
			title="Blog RSS | Ramis Bhatty"
			href={resolve('/(main)/blog/rss.xml')}
		/>
	{/if}
</svelte:head>

<p class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{data.page.path}</p>
{#if !data.hasPublishedPosts}
	<p
		class="not-prose mt-4 inline-block self-start border border-amber-600 px-2 py-1 text-xs text-amber-800 dark:border-amber-500 dark:text-amber-300"
	>
		LOCAL PREVIEW
	</p>
{/if}
<h1>{data.page.title}</h1>
<Content />

{#if data.hasPublishedPosts}
	<p class="text-sm">
		<a href={resolve('/(main)/blog/rss.xml')}>RSS feed</a>
	</p>
{/if}

{#if data.posts.length}
	<EntryList
		entries={data.posts.map((post) => ({
			href: resolve('/(main)/blog/[slug]', { slug: post.slug }),
			title: post.title,
			meta: post.publishedAt ? formatIsoDate(post.publishedAt) : undefined,
			summary: post.summary,
			tags: post.topics,
			draft: post.status === 'draft'
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6 dark:border-neutral-800">No posts yet.</p>
{/if}
