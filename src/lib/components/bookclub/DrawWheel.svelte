<script lang="ts">
	import { onMount } from 'svelte';
	import type { BookclubSuggestion } from '#lib/server/bookclub/cycles';

	let {
		drawId,
		suggestions,
		winnerSuggestionId
	}: {
		drawId: string;
		suggestions: BookclubSuggestion[];
		winnerSuggestionId: string;
	} = $props();

	const colors = ['#00ffff', '#ff66cc', '#ffff00', '#7fff00', '#ff8c00', '#9370db', '#40e0d0'];

	function hashString(value: string): number {
		let hash = 2166136261;
		for (const character of value) {
			hash ^= character.charCodeAt(0);
			hash = Math.imul(hash, 16777619);
		}
		return hash >>> 0;
	}

	function createRandom(seed: number): () => number {
		return () => {
			seed += 0x6d2b79f5;
			let value = seed;
			value = Math.imul(value ^ (value >>> 15), value | 1);
			value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
			return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
		};
	}

	function createWheelState() {
		// The draw ID makes the presentation stable without replacing the persisted random winner.
		const ticketIds = suggestions.map((suggestion) => suggestion.id).sort();
		const random = createRandom(hashString(`${drawId}:${ticketIds.join(':')}`));
		const ordered = [...suggestions].sort((first, second) => first.id.localeCompare(second.id));
		for (let index = ordered.length - 1; index > 0; index -= 1) {
			const target = Math.floor(random() * (index + 1));
			[ordered[index], ordered[target]] = [ordered[target], ordered[index]];
		}

		const winnerIndex = ordered.findIndex((suggestion) => suggestion.id === winnerSuggestionId);
		const sliceAngle = 360 / Math.max(1, ordered.length);
		const turns = 6 + Math.floor(random() * 3);
		return {
			ordered,
			rotation: turns * 360 - (winnerIndex + 0.5) * sliceAngle,
			duration: 4_800 + Math.floor(random() * 1_200)
		};
	}

	function polarPoint(angle: number, radius: number): { x: number; y: number } {
		const radians = (angle * Math.PI) / 180;
		return { x: 50 + Math.cos(radians) * radius, y: 50 + Math.sin(radians) * radius };
	}

	function segmentPath(index: number, total: number): string {
		if (total === 1) return 'M 50 4 A 46 46 0 1 1 49.999 4 Z';
		const angle = 360 / total;
		const start = polarPoint(-90 + index * angle, 46);
		const end = polarPoint(-90 + (index + 1) * angle, 46);
		return `M 50 50 L ${start.x} ${start.y} A 46 46 0 ${angle > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
	}

	function labelPoint(index: number, total: number): { x: number; y: number } {
		return polarPoint(-90 + (index + 0.5) * (360 / total), total > 10 ? 33 : 30);
	}

	let wheel = $derived(createWheelState());
	let winner = $derived(
		wheel.ordered.find((suggestion) => suggestion.id === winnerSuggestionId) ?? null
	);
	let spinning = $state(false);
	let finished = $state(false);

	function play(): void {
		spinning = false;
		finished = false;
		requestAnimationFrame(() => requestAnimationFrame(() => (spinning = true)));
	}

	function finishSpin(event: TransitionEvent): void {
		if (event.propertyName === 'transform' && spinning) finished = true;
	}

	onMount(play);
</script>

<div class="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
	<div class="mx-auto w-full max-w-xl">
		<div class="relative aspect-square" aria-label="Book suggestion wheel">
			<div
				class="absolute top-0 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[18px] border-t-[32px] border-x-transparent border-t-black drop-shadow-[2px_2px_0_#fff]"
				aria-hidden="true"
			></div>
			<svg
				viewBox="0 0 100 100"
				class="size-full drop-shadow-[6px_6px_0_#000]"
				style:transform={`rotate(${spinning ? wheel.rotation : 0}deg)`}
				style:transition-duration={`${spinning ? wheel.duration : 0}ms`}
				ontransitionend={finishSpin}
				role="img"
				aria-label={`${wheel.ordered.length} suggestion tickets spinning toward the saved result`}
			>
				<g class="wheel">
					{#each wheel.ordered as suggestion, index (suggestion.id)}
						<path
							d={segmentPath(index, wheel.ordered.length)}
							fill={colors[index % colors.length]}
							stroke="black"
							stroke-width="1"
						/>
						{@const label = labelPoint(index, wheel.ordered.length)}
						<text
							x={label.x}
							y={label.y}
							text-anchor="middle"
							dominant-baseline="central"
							font-size={wheel.ordered.length > 12 ? 5 : 7}
							font-weight="900"
							fill="black">{index + 1}</text
						>
					{/each}
					<circle cx="50" cy="50" r="8" fill="#d4d0c8" stroke="black" stroke-width="2" />
					<circle cx="50" cy="50" r="2.5" fill="#800080" stroke="black" stroke-width="1" />
				</g>
			</svg>
		</div>
		<button
			type="button"
			onclick={play}
			class="mx-auto mt-5 block border-2 border-black bg-[#d4d0c8] px-4 py-2 font-black shadow-[3px_3px_0_#000] hover:bg-white focus:ring-2 focus:ring-[#000080] focus:outline-none"
		>
			REPLAY DRAW
		</button>
	</div>

	<div>
		<p class="border-2 border-black bg-black p-3 font-bold text-lime-300" aria-live="polite">
			{finished ? 'DRAW COMPLETE // RESULT CONFIRMED' : 'DRAW IN PROGRESS // SHUFFLING TICKETS'}
		</p>
		<ol class="mt-3 grid gap-2 sm:grid-cols-2">
			{#each wheel.ordered as suggestion, index (suggestion.id)}
				<li
					class:border-[#800000]={finished && suggestion.id === winnerSuggestionId}
					class:bg-[#fff0f0]={finished && suggestion.id === winnerSuggestionId}
					class="border-2 border-black bg-white p-3"
				>
					<p class="text-xs font-bold text-[#800080]">
						TICKET {index + 1} // {suggestion.memberName.toUpperCase()}
					</p>
					<p class="mt-1 font-black">{suggestion.title}</p>
					<p class="text-xs">by {suggestion.author}</p>
					{#if finished && suggestion.id === winnerSuggestionId}
						<p class="mt-2 font-black text-[#800000]">SELECTED BOOK</p>
					{/if}
				</li>
			{/each}
		</ol>

		<div
			class="mt-5 border-4 border-black bg-[#ffffcc] p-4 text-center shadow-[4px_4px_0_#000]"
			aria-live="polite"
		>
			{#if finished && winner}
				<p class="text-xs font-bold text-[#800000]">OFFICIAL SAVED RESULT</p>
				<p class="mt-2 text-3xl font-black sm:text-5xl">{winner.title}</p>
				<p class="mt-2 text-lg">by {winner.author}</p>
			{:else}
				<p class="font-black">RESULT CONCEALED // WHEEL IN MOTION</p>
			{/if}
		</div>
	</div>
</div>

<style>
	svg {
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.08, 0.7, 0.08, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			transition-duration: 1ms !important;
		}
	}
</style>
