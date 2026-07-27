<script lang="ts">
	import ContentSections from '$lib/components/main/ContentSections.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.post.title} | Ramis Bhatty</title>
	<meta name="description" content={data.post.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">/BLOG/{data.post.slug.toUpperCase()}</p>
		{#if data.post.status === 'draft'}
			<p class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800">
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.post.title}</h1>
		<p class="mt-4 text-lg leading-8 text-neutral-700">{data.post.summary}</p>
		{#if data.post.publishedAt || data.post.updatedAt}
			<p class="mt-5 font-mono text-sm text-neutral-500">
				{#if data.post.publishedAt}Published {data.post.publishedAt}{/if}
				{#if data.post.updatedAt}
					· Updated {data.post.updatedAt}{/if}
			</p>
		{/if}
		{#if data.post.topics.length}
			<p class="mt-5 text-sm text-neutral-600">{data.post.topics.join(' · ')}</p>
		{/if}
	</header>

	<div class="mt-8 space-y-8">
		<ContentSections sections={data.post.sections} />
	</div>

	{#if data.post.links.length}
		<footer class="mt-10 border-t border-neutral-300 pt-6">
			<h2>Links</h2>
			<ul>
				{#each data.post.links as link (link.href)}
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
