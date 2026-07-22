<script lang="ts">
	import ContentSections from '$lib/components/main/ContentSections.svelte';
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.project.title} | Ramis Bhatty</title>
	<meta name="description" content={data.project.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/WORK/{data.project.slug.toUpperCase()}</p>
		{#if !data.project.published}<p
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
							href={resolve(`/education/${data.module.code.toLowerCase()}`)}
							>{data.module.code}: {data.module.title}</a
						>
					</dd>
				</div>{/if}
		</dl>
		{#if data.project.technologies.length}<p class="mt-5 text-sm text-neutral-600">
				{data.project.technologies.join(' · ')}
			</p>{/if}
	</header>
	<div class="mt-8 space-y-8"><ContentSections sections={data.project.sections} /></div>
	{#if data.project.links.length}
		<footer class="mt-10 border-t border-neutral-300 pt-6">
			<h2>Links</h2>
			<ul>
				{#each data.project.links as link (link.href)}<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Content records contain validated internal or explicit external URLs. -->
						<a href={link.href} rel={link.external ? 'external noreferrer' : undefined}
							>{link.label}{link.external ? ' ↗' : ''}</a
						>
					</li>{/each}
			</ul>
		</footer>
	{/if}
</article>
