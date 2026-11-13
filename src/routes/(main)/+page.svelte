<script lang="ts">
	import { contact, nav } from '#lib/data/config.ts';
	import { pageContent } from '#lib/content.ts';
	import { resolve } from '$app/paths';

	let { data } = $props();
	const Content = pageContent.home;
</script>

<svelte:head>
	<title>Ramis Bhatty</title>
	<meta name="description" content="The personal website of Ramis Bhatty: CV and projects." />
</svelte:head>

<header class="not-prose border-b border-neutral-300 pb-10 dark:border-neutral-800">
	<p class="font-mono text-sm text-neutral-500 dark:text-neutral-400">RAMISBHATTY.COM / INDEX</p>
	<h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Ramis Bhatty</h1>
	<p class="mt-6 max-w-2xl text-lg leading-8 text-neutral-700 dark:text-neutral-300">
		{data.page.introduction}
	</p>
	<p class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
		<a class="underline underline-offset-4" href={resolve(nav.cv)}>CV</a>
		<a class="underline underline-offset-4" href={contact.github} rel="external">GitHub</a>
		<a class="underline underline-offset-4" href={contact.linkedin} rel="external">LinkedIn</a>
		<a class="underline underline-offset-4" href="mailto:{contact.email}">Email</a>
	</p>
</header>

<section class="mt-10"><Content /></section>

<section class="mt-10 border-t border-neutral-300 pt-6 dark:border-neutral-800">
	<h2 class="not-prose text-2xl font-semibold">Selected projects</h2>
	{#if data.projects.length}
		<ul class="mt-5">
			{#each data.projects.slice(0, 3) as project (project.slug)}
				<li>
					<a href={resolve(`work/${project.slug}`)}>{project.title}</a> — {project.summary}
					{#if project.status === 'draft'}<small> (local draft)</small>{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>Project notes are being assembled.</p>
	{/if}
</section>
