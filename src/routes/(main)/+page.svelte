<script lang="ts">
	import { contact, nav } from '$lib/data/config';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>Ramis Bhatty</title>
	<meta
		name="description"
		content="The personal website of Ramis Bhatty: work, education, projects, writing, and interests."
	/>
</svelte:head>

<header class="not-prose border-b border-neutral-300 pb-10">
	<p class="font-mono text-sm text-neutral-500">RAMISBHATTY.COM / INDEX</p>
	<h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Ramis Bhatty</h1>
	<p class="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">{data.personal.introduction}</p>
	<p class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
		<a class="underline underline-offset-4" href={resolve(nav.about)}>About</a>
		<a class="underline underline-offset-4" href={contact.github} rel="external">GitHub ↗</a>
		<a class="underline underline-offset-4" href={contact.linkedin} rel="external">LinkedIn ↗</a>
		<a class="underline underline-offset-4" href="mailto:{contact.email}">Email</a>
	</p>
</header>

<section class="mt-10">
	<h2>Current focus</h2>
	<ul>
		{#each data.personal.currentFocus as item (item.text)}
			<li>
				{item.text}
				{#if item.href}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Focus records contain authored internal URLs. -->
					<a href={item.href}> {item.linkLabel ?? 'Read more'} →</a>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<section class="mt-10 border-t border-neutral-300 pt-6">
	<div class="not-prose flex items-baseline justify-between gap-4">
		<h2 class="text-2xl font-semibold">Selected work</h2>
		<a class="text-sm underline underline-offset-4" href={resolve(nav.work)}>All work →</a>
	</div>
	{#if data.projects.length}
		<ul class="mt-5">
			{#each data.projects.slice(0, 3) as project (project.slug)}
				<li>
					<a href={resolve(`/work/${project.slug}`)}>{project.title}</a> — {project.summary}
					{#if project.status === 'draft'}<small> (local draft)</small>{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>Project notes are being assembled.</p>
	{/if}
</section>

<section class="mt-10 border-t border-neutral-300 pt-6">
	<div class="not-prose flex items-baseline justify-between gap-4">
		<h2 class="text-2xl font-semibold">Education</h2>
		<a class="text-sm underline underline-offset-4" href={resolve(nav.education)}>All modules →</a>
	</div>
	{#if data.modules.length}
		<ul class="mt-5">
			{#each data.modules.slice(0, 4) as module (module.code)}
				<li>
					<a href={resolve(`/education/${module.code.toLowerCase()}`)}
						>{module.code}: {module.title}</a
					>{module.status === 'draft' ? ' (local draft)' : ''}
				</li>
			{/each}
		</ul>
	{:else}
		<p>Module notes are being assembled.</p>
	{/if}
</section>

<section class="mt-10 border-t border-neutral-300 pt-6">
	<h2>Explore</h2>
	<dl class="not-prose mt-5 grid gap-5 sm:grid-cols-2">
		{#each data.exploreDestinations as destination (destination.href)}
			<div>
				<dt>
					<a class="font-semibold underline underline-offset-4" href={resolve(destination.href)}
						>{destination.title}</a
					>
				</dt>
				<dd class="mt-1 text-sm text-neutral-600">{destination.description}</dd>
			</div>
		{/each}
	</dl>
</section>
