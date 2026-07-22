<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Parent routes provide generated internal entry URLs. */
	interface Entry {
		href: string;
		title: string;
		meta?: string;
		summary: string;
		tags?: string[];
		draft?: boolean;
	}

	let { entries }: { entries: Entry[] } = $props();
</script>

<div class="not-prose divide-y divide-neutral-300 border-y border-neutral-300">
	{#each entries as entry (entry.href)}
		<article class="py-5">
			<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 class="text-lg font-semibold">
					<a
						class="underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900"
						href={entry.href}
					>
						{entry.title}
					</a>
				</h2>
				{#if entry.meta}<p class="font-mono text-xs text-neutral-500">{entry.meta}</p>{/if}
			</div>
			<p class="mt-2 leading-6 text-neutral-700">{entry.summary}</p>
			{#if entry.tags?.length || entry.draft}
				<p class="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
					{#if entry.draft}<span class="border border-amber-600 px-2 py-1 text-amber-800"
							>LOCAL DRAFT</span
						>{/if}
					{#each entry.tags ?? [] as tag (tag)}<span class="border border-neutral-300 px-2 py-1"
							>{tag}</span
						>{/each}
				</p>
			{/if}
		</article>
	{/each}
</div>
