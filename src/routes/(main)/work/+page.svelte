<script lang="ts">
	import EntryList from '$lib/components/main/EntryList.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>Work | Ramis Bhatty</title>
	<meta name="description" content="Projects and work by Ramis Bhatty." />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">/WORK</p>
<h1>Work</h1>
<p class="lead">
	Projects, including work developed through university modules. Each entry focuses on the problem,
	my contribution, and what I learned.
</p>

{#if data.projects.length}
	<EntryList
		entries={data.projects.map((project) => ({
			href: `/work/${project.slug}`,
			title: project.title,
			meta: project.period,
			summary: project.summary,
			tags: project.technologies,
			draft: !project.published
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6">Project entries are being assembled.</p>
{/if}
