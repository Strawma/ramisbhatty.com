<script lang="ts">
	import EntryList from '#lib/components/main/EntryList.svelte';
	import { pageContent } from '#lib/content';
	let { data } = $props();
	const Content = pageContent.work;
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<Content />

{#if data.experience.length}
	<h2>Experience</h2>
	<EntryList
		entries={data.experience.map((entry) => ({
			href: `/work/experience/${entry.slug}`,
			title: `${entry.role} — ${entry.organisation}`,
			meta: entry.period,
			summary: entry.summary,
			draft: entry.status === 'draft'
		}))}
	/>
{/if}

<h2>Projects</h2>
{#if data.projects.length}
	<EntryList
		entries={data.projects.map((project) => ({
			href: `/work/${project.slug}`,
			title: project.title,
			meta: project.period,
			summary: project.summary,
			tags: project.technologies,
			draft: project.status === 'draft'
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6">Project entries are being assembled.</p>
{/if}
