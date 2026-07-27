<script lang="ts">
	import { pageContent, pageIntroductions } from '$lib/content';

	const page = pageIntroductions.cv;
	const Content = pageContent.cv;
</script>

<svelte:head>
	<title>{page.title} | Ramis Bhatty</title>
	<meta name="description" content={page.description} />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{page.path}</p>
<h1>{page.title}</h1>
<Content />
