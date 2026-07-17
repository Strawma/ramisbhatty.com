<script lang="ts">
	import { onMount } from 'svelte';
	let { class: className = '' } = $props();

	let currentFact = $state('');
	let isLoading = $state(false);

	async function generateFact() {
		isLoading = true;
		currentFact = '';

		try {
			const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
			const data = await response.json();

			if (data.text) {
				currentFact = data.text;
			} else {
				currentFact = 'Failed to generate fact. Please try again!';
			}
		} catch (error) {
			console.error('Error generating fact:', error);
			currentFact = 'Error generating fact. Please try again!';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		generateFact();
	});
</script>

<div
	class="border-4 border-black bg-[#00ffff] p-4 text-center {className}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<h2 class="mb-4 text-center text-2xl font-bold underline">&lt; RANDOM FACT GENERATOR &gt;</h2>
	<div class="mb-4 border-2 border-black bg-white p-4">
		{#if isLoading}
			<p class="text-ls min-h-23 animate-pulse italic">Loading fact from the World Wide Web...</p>
		{:else}
			<p class="min-h-23 text-xs break-all italic">"{currentFact}"</p>
		{/if}
	</div>
	<button
		onclick={generateFact}
		class="cursor-pointer border-4 border-black bg-linear-to-b from-[#c0c0c0] to-[#808080] px-5 py-2 font-bold hover:from-[#e0e0e0]"
		style="box-shadow: 2px 2px 0 #000;"
	>
		GENERATE NEW FACT →
	</button>
</div>
