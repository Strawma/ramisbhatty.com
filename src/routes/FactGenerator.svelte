<script lang="ts">
	import { onMount } from 'svelte';

	let currentFact = $state("");
	let isLoading = $state(false);

	async function generateFact() {
		isLoading = true;
		currentFact = "";

		try {
			const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
			const data = await response.json();

			if (data.text) {
				currentFact = data.text;
			} else {
				currentFact = "Failed to generate fact. Please try again!";
			}
		} catch (error) {
			console.error('Error generating fact:', error);
			currentFact = "Error generating fact. Please try again!";
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		generateFact();
	});
</script>

<div class="bg-[#00ffff] border-4 border-black p-4 " style="box-shadow: 4px 4px 0 #000;">
	<h2 class="text-2xl font-bold mb-4 text-center underline">&lt; RANDOM FACT GENERATOR &gt;</h2>
	<div class="bg-white border-2 border-black p-4 mb-4">
		{#if isLoading}
			<p class="text-ls italic animate-pulse min-h-23">Loading fact from the World Wide Web...</p>
		{:else}
			<p class="text-xs italic break-all min-h-23">"{currentFact}"</p>
		{/if}
	</div>
	<button
		onclick={generateFact}
		class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-4 border-black px-6 py-2 font-bold hover:from-[#e0e0e0]"
		style="box-shadow: 2px 2px 0 #000;">
		GENERATE NEW FACT →
	</button>
</div>
