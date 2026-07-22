<script lang="ts">
	import EntryList from '$lib/components/main/EntryList.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>Education | Ramis Bhatty</title>
	<meta
		name="description"
		content="Education, university modules, and related projects by Ramis Bhatty."
	/>
</svelte:head>

<p class="font-mono text-sm text-neutral-500">/EDUCATION</p>
<h1>Education</h1>
<p class="lead">
	TODO: Add your course, institution, attendance dates, and a short explanation of what you have
	concentrated on.
</p>

<h2>Modules</h2>
{#if data.modules.length}
	<EntryList
		entries={data.modules.map((module) => ({
			href: `/education/${module.code.toLowerCase()}`,
			title: `${module.code}: ${module.title}`,
			meta: module.year,
			summary: module.summary,
			tags: module.topics,
			draft: !module.published
		}))}
	/>
{:else}
	<p class="border-y border-neutral-300 py-6">Module entries are being assembled.</p>
{/if}
