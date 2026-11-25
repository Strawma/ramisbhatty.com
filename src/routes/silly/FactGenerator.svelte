<script lang="ts">
	import { onMount } from 'svelte';
	import { HORROR_ARCHIVE_RECORDS } from './silly-horror-data';

	let { class: className = '', horror = false }: { class?: string; horror?: boolean } = $props();

	let currentFact = $state('');
	let isLoading = $state(false);
	let horrorIndex = $state(0);

	// The retro page intentionally uses the external facts service. Keep failure visible in the
	// panel so the rest of the page remains usable when that service is unavailable.
	async function generateFact() {
		isLoading = true;
		currentFact = '';

		try {
			const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
			if (!response.ok) throw new Error(`Fact request failed with status ${response.status}`);
			const data = await response.json();

			if (
				data &&
				typeof data === 'object' &&
				'text' in data &&
				typeof data.text === 'string' &&
				data.text
			) {
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

	function nextHorrorRecord() {
		horrorIndex = (horrorIndex + 1) % HORROR_ARCHIVE_RECORDS.length;
	}

	onMount(() => {
		generateFact();
	});
</script>

<div
	class="p-4 text-center {horror
		? 'silly-horror-panel'
		: 'border-4 border-black bg-[#00ffff]'} {className}"
	style={horror ? undefined : 'box-shadow: 4px 4px 0 #000;'}
>
	<h2 class="mb-4 text-center text-2xl font-bold underline {horror ? 'text-red-400' : ''}">
		{horror ? '< EMERGENCY ARCHIVE >' : '< RANDOM FACT GENERATOR >'}
	</h2>
	<div
		class="mb-4 border-2 p-4 {horror
			? 'border-red-900 bg-black text-zinc-200'
			: 'border-black bg-white'}"
		role="status"
		aria-live="polite"
		aria-busy={horror ? false : isLoading}
	>
		{#if horror}
			<p class="min-h-23 text-xs italic">"{HORROR_ARCHIVE_RECORDS[horrorIndex]}"</p>
		{:else if isLoading}
			<p class="text-ls min-h-23 animate-pulse italic">Loading fact from the World Wide Web...</p>
		{:else}
			<p class="min-h-23 text-xs break-all italic">"{currentFact}"</p>
		{/if}
	</div>
	<button
		onclick={horror ? nextHorrorRecord : generateFact}
		disabled={horror ? false : isLoading}
		class="px-5 py-2 font-bold focus-visible:outline-4 focus-visible:outline-offset-2 {horror
			? 'silly-horror-btn focus-visible:outline-red-400'
			: 'cursor-pointer border-4 border-black bg-linear-to-b from-[#c0c0c0] to-[#808080] hover:from-[#e0e0e0] focus-visible:outline-purple-800 disabled:cursor-wait disabled:opacity-70'}"
		style={horror ? undefined : 'box-shadow: 2px 2px 0 #000;'}
	>
		{horror ? 'RETRIEVE NEXT RECORD →' : 'GENERATE NEW FACT →'}
	</button>
</div>
