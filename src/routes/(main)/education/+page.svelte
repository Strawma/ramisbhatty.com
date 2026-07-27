<script lang="ts">
	import EntryList from '$lib/components/main/EntryList.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>
<p class="lead">{data.education.overview}</p>

<h2>Modules</h2>
{#if data.modules.length}
	<EntryList
		entries={data.modules.map((module) => ({
			href: `/education/${module.code.toLowerCase()}`,
			title: `${module.code}: ${module.title}`,
			meta: module.year,
			summary: module.summary,
			tags: module.topics,
			draft: module.status === 'draft'
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6">Module entries are being assembled.</p>
{/if}
