<script lang="ts">
	import { pageContent } from '$lib/content';

	let { data } = $props();
	const Content = pageContent.about;
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<Content />

{#if data.experience.length}
	<section class="border-t border-neutral-300 pt-6">
		<h2>Currently</h2>
		{#each data.experience as entry (entry.slug)}
			<p>
				{entry.summary}
				{#if entry.status === 'draft'}<small> (local draft)</small>{/if}
			</p>
		{/each}
	</section>
{/if}
