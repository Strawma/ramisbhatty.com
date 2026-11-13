<script lang="ts">
	import { asset } from '$app/paths';
	import { contact, documents } from '#lib/data/config.ts';
	import { pageContent } from '#lib/content.ts';

	let { data } = $props();
	const Content = pageContent.cv;
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<header class="not-prose border-b border-neutral-300 pb-8 text-center print:pb-3">
	<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl print:text-2xl">Ramis Bhatty</h1>
	<p class="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm print:mt-2 print:text-xs">
		<a class="underline underline-offset-4" href="mailto:{contact.email}">{contact.email}</a>
		<a class="break-words underline underline-offset-4" href={contact.github} rel="external"
			>github.com/Strawma</a
		>
		<a class="break-words underline underline-offset-4" href={contact.linkedin} rel="external"
			>linkedin.com/in/ramis-bhatty</a
		>
		<a class="underline underline-offset-4 print:hidden" href={asset(documents.cv)} download
			>Download PDF</a
		>
	</p>
</header>

<section class="not-prose">
	<h2>Profile</h2>
	<p class="text-base leading-7 text-neutral-700 print:text-sm print:leading-5">
		{data.page.introduction}
	</p>
</section>

<div>
	<Content />
</div>
