<script lang="ts">
	import { experienceContent } from '$lib/content';

	let { data } = $props();
	let Content = $derived(experienceContent[data.experience.slug]);
</script>

<svelte:head>
	<title>{data.experience.role}, {data.experience.organisation} | Ramis Bhatty</title>
	<meta name="description" content={data.experience.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">
			/WORK/EXPERIENCE/{data.experience.slug.toUpperCase()}
		</p>
		{#if data.experience.status === 'draft'}
			<p class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800">
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.experience.role}</h1>
		<p class="mt-3 font-mono text-sm text-neutral-500">
			{data.experience.organisation} · {data.experience.period}
		</p>
		<p class="mt-5 text-lg leading-8 text-neutral-700">{data.experience.summary}</p>
	</header>

	<div class="mt-8 space-y-8"><Content /></div>
</article>
