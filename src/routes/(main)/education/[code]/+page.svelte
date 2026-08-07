<script lang="ts">
	import ModuleMark from '#lib/components/main/ModuleMark.svelte';
	import { moduleContent } from '#lib/content';
	import { resolve } from '$app/paths';
	let { data } = $props();
	let Content = $derived(moduleContent[data.module.slug]);
</script>

<svelte:head>
	<title>{data.module.code}: {data.module.title} | Ramis Bhatty</title>
	<meta name="description" content={data.module.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/EDUCATION/{data.module.code}</p>
		{#if data.module.status === 'draft'}<p
				class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800"
			>
				LOCAL DRAFT
			</p>{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">
			{data.module.code}: {data.module.title}
		</h1>
		<p class="mt-3 font-mono text-sm text-neutral-500">
			{data.module.year}{data.module.semester ? ` · ${data.module.semester}` : ''}
		</p>
		{#if data.module.mark !== undefined}
			<p class="mt-4"><ModuleMark mark={data.module.mark} /></p>
		{/if}
		<p class="mt-5 text-lg leading-8 text-neutral-700">{data.module.summary}</p>
		{#if data.module.skills.length || data.module.technologies.length}
			<div class="mt-5 space-y-1 text-sm text-neutral-600">
				{#if data.module.skills.length}
					<p>
						<span class="font-mono text-xs text-neutral-500">SKILLS</span>
						{data.module.skills.join(' · ')}
					</p>
				{/if}
				{#if data.module.technologies.length}
					<p>
						<span class="font-mono text-xs text-neutral-500">TECHNOLOGIES</span>
						{data.module.technologies.join(' · ')}
					</p>
				{/if}
			</div>
		{/if}
	</header>
	<div class="mt-8 space-y-8"><Content /></div>
	{#if data.projects.length}
		<section class="mt-10 border-t border-neutral-300 pt-6">
			<h2>Related projects</h2>
			<ul>
				{#each data.projects as project (project.slug)}<li>
						<a href={resolve(`work/${project.slug}`)}>{project.title}</a> — {project.summary}
					</li>{/each}
			</ul>
		</section>
	{/if}
</article>
