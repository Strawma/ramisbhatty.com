<script lang="ts">
	import { interests } from '$lib/content';
</script>

<svelte:head>
	<title>Interests | Ramis Bhatty</title>
	<meta name="description" content="Games, books, and other interests collected by Ramis Bhatty." />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">/INTERESTS</p>
<h1>Interests</h1>
<p class="lead">
	A less formal index of games, books, and other things I want to remember or write about.
</p>

<div class="not-prose mt-8 grid gap-5 sm:grid-cols-2">
	{#each interests as category (category.slug)}
		<section class="border-t border-neutral-300 pt-4">
			<h2 class="text-lg font-semibold">{category.title}</h2>
			<p class="mt-2 text-sm leading-6 text-neutral-600">{category.summary}</p>
			{#if category.items.length}
				<ul class="mt-3 text-sm">
					{#each category.items as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>
