<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import MidiPlayer from './MidiPlayer.svelte';
	import { nav } from '$lib/data/config' ;

	let {
		midiFiles,
	}: {
		midiFiles: Record<string, unknown>;
	} = $props();

	let clicks = $state(0);
	let currentTime = $state(new Date().toLocaleString());

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleString();
		}, 3000);
		return () => clearInterval(interval);
	});

	interface NavLink {
		label: string;
		href: string;
	}

	const navLinks: NavLink[] = [
		{ label: 'Home', href: nav.home},
	];
</script>

<aside class="md:col-span-1 space-y-4">
	<!-- Navigation -->
	<nav class="bg-[#ffff00] retro-panel p-4">
		<h2 class="text-xl font-bold mb-3 text-center underline">: : MENU : :</h2>
		<ul class="space-y-2">
			{#each navLinks as link (link.label)}
				<li>
					<a href={link.href} class="text-blue-600 underline hover:text-red-600">
						> {link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Chaos button -->
	<div class="bg-linear-to-b from-[#ff0000] to-[#8b0000] retro-panel p-4 text-center">
		<button
			onclick={() => clicks++}
			class="animate-pulse text-white font-bold text-lg bg-red-600
             border-2 border-yellow-300 px-4 py-2 hover:bg-red-700 cursor-pointer"
		>
			CLICK ME!
		</button>
		{#if clicks > 0}
			<p class="text-yellow-300 mt-2 text-sm" in:fade>Clicks: {clicks}</p>
		{/if}
	</div>

	<!-- Clock -->
	<div class="bg-black text-lime-400 border-4 border-[#00ff00] p-3 font-mono text-sm text-center">
		{currentTime}
	</div>

	<!-- MIDI Player -->
	<MidiPlayer {midiFiles} />
</aside>