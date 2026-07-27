<script lang="ts">
	import { nav } from '$lib/data/config';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<p class="lead">{data.personal.about}</p>

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

<section class="border-t border-neutral-300 pt-6">
	<h2>{data.siteCopy.heading}</h2>
	<p>{data.siteCopy.paragraph}</p>
	<ul>
		<li><a href={resolve(nav.work)}>Work and projects</a></li>
		<li><a href={resolve(nav.education)}>Education and modules</a></li>
		<li><a href={resolve(nav.blog)}>Blog</a></li>
		<li><a href={resolve(nav.interests)}>Interests</a></li>
	</ul>
</section>
