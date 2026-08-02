<script lang="ts">
	import { projectContent } from '#lib/content';
	import { resolve } from '$app/paths';
	let { data } = $props();
	let Content = $derived(projectContent[data.project.slug]);
</script>

<svelte:head>
	<title>{data.project.title} | Ramis Bhatty</title>
	<meta name="description" content={data.project.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/WORK/{data.project.slug.toUpperCase()}</p>
		{#if data.project.status === 'draft'}<p
				class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800"
			>
				LOCAL DRAFT
			</p>{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.project.title}</h1>
		<p class="mt-4 text-lg leading-8 text-neutral-700">{data.project.summary}</p>
		<dl class="mt-6 grid gap-2 text-sm sm:grid-cols-2">
			{#if data.project.period}<div>
					<dt class="font-semibold">Period</dt>
					<dd>{data.project.period}</dd>
				</div>{/if}
			{#if data.module}<div>
					<dt class="font-semibold">Related module</dt>
					<dd>
						<a
							class="underline underline-offset-4"
							href={resolve(`education/${data.module.code.toLowerCase()}`)}
							>{data.module.code}: {data.module.title}</a
						>
					</dd>
				</div>{/if}
		</dl>
		{#if data.project.technologies.length}<p class="mt-5 text-sm text-neutral-600">
				{data.project.technologies.join(' · ')}
			</p>{/if}
	</header>
	<div class="mt-8 space-y-8"><Content /></div>
</article>
