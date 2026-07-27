<script lang="ts">
	import { contact } from '$lib/data/config';
	import { pageIntroductions } from '$lib/content';

	const page = pageIntroductions.cv;
</script>

<svelte:head>
	<title>{page.title} | Ramis Bhatty</title>
	<meta name="description" content={page.description} />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{page.path}</p>
<h1>{page.title}</h1>
<p class="lead">{page.lead}</p>
<p>
	Until then, the rest of the site documents projects and education in more detail. For a copy
	directly, contact <a href="mailto:{contact.email}">{contact.email}</a>.
</p>
