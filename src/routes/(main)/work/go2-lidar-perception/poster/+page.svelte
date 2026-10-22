<script lang="ts">
	import { resolve } from '$app/paths';
	import { pageContent, pageIntroductions } from '#lib/content.ts';

	const poster = pageIntroductions['go2-poster'];
	const Content = pageContent['go2-poster'];
</script>

<svelte:head>
	<title>{poster.title} | Ramis Bhatty</title>
	<meta name="description" content={poster.description} />
</svelte:head>

<article>
	<p class="font-mono text-sm text-neutral-500">RESEARCH POSTER · AUGUST 2026</p>
	<h1>{poster.title}</h1>
	<Content />
	<p><a href={resolve('/(main)/work')}>Browse all work →</a></p>
</article>
