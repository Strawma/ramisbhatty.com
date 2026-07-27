<script lang="ts">
	import EntryList from '$lib/components/main/EntryList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
	{#if !data.hasPublishedPosts}
		<meta name="robots" content="noindex, follow" />
	{/if}
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<p class="lead">{data.page.lead}</p>

{#if data.posts.length}
	<EntryList
		entries={data.posts.map((post) => ({
			href: `/blog/${post.slug}`,
			title: post.title,
			meta: post.publishedAt,
			summary: post.summary,
			tags: post.topics,
			draft: post.status === 'draft'
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6">No published posts yet.</p>
{/if}
