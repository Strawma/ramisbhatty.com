<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Content records contain validated internal or explicit external URLs. */
	import type { ContentSection } from '$lib/data/main-site';

	let { sections }: { sections: ContentSection[] } = $props();
</script>

{#each sections as section (section.heading)}
	<section class="border-t border-neutral-300 pt-6">
		<h2>{section.heading}</h2>
		{#each section.paragraphs ?? [] as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
		{#if section.bullets?.length}
			<ul>
				{#each section.bullets as bullet (bullet)}
					<li>{bullet}</li>
				{/each}
			</ul>
		{/if}
		{#if section.links?.length}
			<ul class="not-prose flex flex-wrap gap-x-4 gap-y-2 text-sm">
				{#each section.links as link (link.href)}
					<li>
						<a
							href={link.href}
							rel={link.external ? 'external noreferrer' : undefined}
							class="font-medium underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900"
						>
							{link.label}{link.external ? ' ↗' : ''}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
		{#if section.images?.length}
			<div class="not-prose mt-6 grid gap-5 sm:grid-cols-2">
				{#each section.images as image (image.src)}
					<figure>
						<img src={image.src} alt={image.alt} class="w-full border border-neutral-300" />
						{#if image.caption}<figcaption class="mt-2 text-sm text-neutral-600">
								{image.caption}
							</figcaption>{/if}
					</figure>
				{/each}
			</div>
		{/if}
	</section>
{/each}
