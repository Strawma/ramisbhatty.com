<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.title} | Interests | Ramis Bhatty</title>
	<meta name="description" content={data.category.summary} />
</svelte:head>

<article>
	<header class="not-prose border-b border-neutral-300 pb-8">
		<p class="font-mono text-sm text-neutral-500">
			/INTERESTS/{data.category.slug.toUpperCase()}
		</p>
		{#if data.category.status === 'draft'}
			<p class="mt-4 inline-block border border-amber-600 px-2 py-1 text-xs text-amber-800">
				LOCAL DRAFT
			</p>
		{/if}
		<h1 class="mt-4 text-4xl font-semibold tracking-tight">{data.category.title}</h1>
		<p class="mt-5 text-lg leading-8 text-neutral-700">{data.category.summary}</p>
	</header>

	{#if data.category.items.length}
		<div class="not-prose divide-y divide-neutral-300 border-b border-neutral-300">
			{#each data.category.items as item (item.title)}
				<article class="py-5">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="text-lg font-semibold">
							{#if item.href}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Interest records may contain internal or external authored URLs. -->
								<a
									class="underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900"
									href={item.href}>{item.title}</a
								>
							{:else}
								{item.title}
							{/if}
						</h2>
						{#if item.date}
							<p class="font-mono text-xs text-neutral-500">{item.date}</p>
						{/if}
					</div>
					{#if item.note}
						<p class="mt-2 leading-6 text-neutral-700">{item.note}</p>
					{/if}
				</article>
			{/each}
		</div>
	{:else}
		<p class="border-b border-neutral-300 py-6">
			Notes for this section are still being assembled.
		</p>
	{/if}
</article>
