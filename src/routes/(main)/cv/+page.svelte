<script lang="ts">
	import { contact } from '#lib/data/config.ts';
	import { pageContent } from '#lib/content.ts';

	let { data } = $props();
	const Content = pageContent.cv;
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<header class="not-prose border-b border-neutral-300 pb-8 print:pb-3">
	<p class="font-mono text-sm text-neutral-500 print:hidden">{data.page.path}</p>
	<h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl print:mt-0 print:text-2xl">
		{data.page.title}
	</h1>
	<p
		class="mt-6 max-w-2xl text-lg leading-8 text-neutral-700 print:mt-2 print:text-sm print:leading-5"
	>
		{data.page.introduction}
	</p>
	<p class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm print:mt-2 print:text-xs">
		<a class="underline underline-offset-4" href="mailto:{contact.email}">{contact.email}</a>
		<a class="underline underline-offset-4" href={contact.github} rel="external">GitHub ↗</a>
		<a class="underline underline-offset-4" href={contact.linkedin} rel="external">LinkedIn ↗</a>
		<button
			type="button"
			class="cursor-pointer underline underline-offset-4 print:hidden"
			onclick={() => window.print()}
		>
			Print / save as PDF
		</button>
	</p>
</header>

<div class="mt-8 print:mt-3">
	<Content />
</div>
