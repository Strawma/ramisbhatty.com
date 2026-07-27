<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
	{#if !data.hasPublishedInterests}
		<meta name="robots" content="noindex, follow" />
	{/if}
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<p class="lead">{data.page.lead}</p>

{#if data.interests.length}
	<div class="not-prose mt-8 grid gap-5 sm:grid-cols-2">
		{#each data.interests as category (category.slug)}
			<section class="border-t border-neutral-300 pt-4">
				<div class="flex flex-wrap items-baseline gap-2">
					<h2 class="text-lg font-semibold">
						<a
							class="underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900"
							href={resolve(`/interests/${category.slug}`)}>{category.title}</a
						>
					</h2>
					{#if category.status === 'draft'}
						<span class="border border-amber-600 px-2 py-1 text-xs text-amber-800">
							LOCAL DRAFT
						</span>
					{/if}
				</div>
				<p class="mt-2 text-sm leading-6 text-neutral-600">{category.summary}</p>
				{#if category.items.length}
					<ul class="mt-3 text-sm">
						{#each category.items as item (item.title)}
							<li>
								{#if item.href}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Interest records may contain internal or external authored URLs. -->
									<a href={item.href}>{item.title}</a>
								{:else}
									{item.title}
								{/if}
								{#if item.date}
									<span class="font-mono text-xs text-neutral-500"> · {item.date}</span>
								{/if}
								{#if item.note}
									— {item.note}{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}
	</div>
{:else}
	<p class="border-y border-neutral-300 py-6">No published interest notes yet.</p>
{/if}
