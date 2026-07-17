<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import MidiPlayer from './MidiPlayer.svelte';
	import { nav } from '$lib/data/config';
	import { resolve } from '$app/paths';

	let {
		midiFiles
	}: {
		midiFiles: Record<string, unknown>;
	} = $props();

	let clicks = $state(0);
	let currentTime = $state(new Date().toLocaleString());

	onMount(() => {
		// Both values are decorative client-side state; stop the interval when navigating away.
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleString();
		}, 3000);
		return () => clearInterval(interval);
	});

	interface NavLink {
		label: string;
		href: string;
		internal: boolean;
	}

	const navLinks: NavLink[] = [
		{ label: 'Home', href: nav.home, internal: true },
		{ label: 'legacy', href: nav.legacy, internal: false }
	];
</script>

<aside class="space-y-4 md:col-span-1">
	<!-- Navigation -->
	<nav class="retro-panel bg-[#ffff00] p-4">
		<h2 class="mb-3 text-center text-xl font-bold underline">: : MENU : :</h2>
		<ul class="space-y-2">
			{#each navLinks as link (link.label)}
				<li>
					{#if link.internal}
						<a href={resolve(nav.home)} class="text-blue-600 underline hover:text-red-600">
							> {link.label}
						</a>
					{:else}
						<a href={link.href} rel="external" class="text-blue-600 underline hover:text-red-600">
							> {link.label}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Chaos button -->
	<div class="retro-panel bg-linear-to-b from-[#ff0000] to-[#8b0000] p-4 text-center">
		<button
			onclick={() => clicks++}
			class="animate-pulse cursor-pointer border-2 border-yellow-300 bg-red-600
             px-4 py-2 text-lg font-bold text-white hover:bg-red-700"
		>
			CLICK ME!
		</button>
		{#if clicks > 0}
			<p class="mt-2 text-sm text-yellow-300" in:fade>Clicks: {clicks}</p>
		{/if}
	</div>

	<!-- Clock -->
	<div class="border-4 border-[#00ff00] bg-black p-3 text-center font-mono text-sm text-lime-400">
		{currentTime}
	</div>

	<!-- MIDI Player -->
	<MidiPlayer {midiFiles} />
</aside>
