<script lang="ts">
	import ContentSections from '$lib/components/main/ContentSections.svelte';
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.module.code}: {data.module.title} | Ramis Bhatty</title>
	<meta name="description" content={data.module.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/EDUCATION/{data.module.code}</p>
		{#if !data.module.published}<p
				class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800"
			>
				LOCAL DRAFT
			</p>{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">
			{data.module.code}: {data.module.title}
		</h1>
		<p class="mt-3 font-mono text-sm text-neutral-500">{data.module.year}</p>
		<p class="mt-5 text-lg leading-8 text-neutral-700">{data.module.summary}</p>
		{#if data.module.topics.length}<p class="mt-5 text-sm text-neutral-600">
				{data.module.topics.join(' · ')}
			</p>{/if}
	</header>
	<div class="mt-8 space-y-8"><ContentSections sections={data.module.sections} /></div>
	{#if data.projects.length}
		<section class="mt-10 border-t border-neutral-300 pt-6">
			<h2>Related projects</h2>
			<ul>
				{#each data.projects as project (project.slug)}<li>
						<a href={resolve(`/work/${project.slug}`)}>{project.title}</a> — {project.summary}
					</li>{/each}
			</ul>
		</section>
	{/if}
</article>
