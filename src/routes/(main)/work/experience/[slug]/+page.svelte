<script lang="ts">
	import ContentSections from '$lib/components/main/ContentSections.svelte';

	let { data } = $props();
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

	{#if data.experience.sections.length}
		<div class="mt-8 space-y-8">
			<ContentSections sections={data.experience.sections} />
		</div>
	{/if}

	{#if data.experience.links.length}
		<footer class="mt-10 border-t border-neutral-300 pt-6">
			<h2>Links</h2>
			<ul>
				{#each data.experience.links as link (link.href)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Content records contain validated internal or explicit external URLs. -->
						<a href={link.href} rel={link.external ? 'external noreferrer' : undefined}>
							{link.label}{link.external ? ' ↗' : ''}
						</a>
					</li>
				{/each}
			</ul>
		</footer>
	{/if}
</article>
