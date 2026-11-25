<script lang="ts">
	import PageConnections from '#lib/components/main/PageConnections.svelte';
	import { pageContent } from '#lib/content.ts';

	let { data } = $props();
	const Content = pageContent['go2-poster'];
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<article>
	<p class="font-mono text-sm text-neutral-500 dark:text-neutral-400">
		RESEARCH POSTER · AUGUST 2026
	</p>
	<h1>{data.page.title}</h1>
	<Content />
	<PageConnections related={data.connections.related} mentionedBy={data.connections.mentionedBy} />
</article>
