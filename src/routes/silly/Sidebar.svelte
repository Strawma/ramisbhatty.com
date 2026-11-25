<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import MidiPlayer from './MidiPlayer.svelte';
	import { formatHorrorTimestamp, getHorrorClickMessage } from './silly-horror-data';
	import { nav } from '#lib/data/config.ts';
	import { resolve } from '$app/paths';

	let {
		midiFiles,
		horror = false
	}: {
		midiFiles: Record<string, unknown>;
		horror?: boolean;
	} = $props();

	let clicks = $state(0);
	let currentTime = $state('Loading local time...');
	let currentDateTime = $state<string>();
	let horrorTick = $state(0);

	onMount(() => {
		const updateClock = () => {
			const now = new Date();
			currentTime = now.toLocaleString();
			currentDateTime = now.toISOString();
		};

		updateClock();
		const interval = setInterval(updateClock, 3000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!horror) {
			horrorTick = 0;
			return;
		}

		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (motionPreference.matches) return;

		const interval = window.setInterval(() => {
			horrorTick += 1;
		}, 1000);

		return () => clearInterval(interval);
	});

	const navLinks = [
		{ label: 'Home', href: nav.home, internal: true },
		{ label: 'About Me', href: 'silly/who-is-ramis-bhatty', internal: true },
		{ label: 'legacy', href: nav.legacy, internal: true }
	] as const;
</script>

<aside class="space-y-4 md:col-span-1">
	<!-- Navigation -->
	<nav class="{horror ? 'silly-horror-panel' : 'retro-panel bg-[#ffff00]'} p-4">
		<h2 class="mb-3 text-center text-xl font-bold underline">
			{horror ? ': : DOORS : :' : ': : MENU : :'}
		</h2>
		<ul class="space-y-2">
			{#each navLinks as link (link.label)}
				<li>
					{#if link.internal}
						<a
							href={resolve(link.href)}
							class="underline {horror
								? 'text-red-400 hover:text-zinc-100'
								: 'text-blue-600 hover:text-red-600'}"
						>
							> {link.label}
						</a>
					{:else}
						<a
							href={link.href}
							rel="external"
							class="underline {horror
								? 'text-red-400 hover:text-zinc-100'
								: 'text-blue-600 hover:text-red-600'}"
						>
							> {link.label}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Chaos button -->
	<div
		class="p-4 text-center {horror
			? 'silly-horror-panel bg-linear-to-b from-[#2b080c] to-[#09090b]'
			: 'retro-panel bg-linear-to-b from-[#ff0000] to-[#8b0000]'}"
	>
		<button
			onclick={() => clicks++}
			class="px-4 py-2 text-lg font-bold motion-reduce:animate-none {horror
				? 'silly-horror-btn text-red-200'
				: 'animate-pulse cursor-pointer border-2 border-yellow-300 bg-red-600 text-white hover:bg-red-700'}"
		>
			{horror ? 'DO NOT PRESS' : 'CLICK ME!'}
		</button>
		{#if clicks > 0}
			<p class="mt-2 text-sm {horror ? 'text-red-400' : 'text-yellow-300'}" in:fade>
				{horror ? getHorrorClickMessage(clicks) : `Clicks: ${clicks}`}
			</p>
		{/if}
	</div>

	<!-- Clock -->
	<div
		class="border-4 bg-black p-3 text-center font-mono text-sm {horror
			? 'border-red-900 text-red-400'
			: 'border-[#00ff00] text-lime-400'}"
	>
		{#if horror}
			<time datetime="1998-10-31T03:14:59Z" aria-live="off">
				{formatHorrorTimestamp(horrorTick)}
			</time>
		{:else}
			<time datetime={currentDateTime} aria-live="off">{currentTime}</time>
		{/if}
	</div>

	<!-- MIDI Player -->
	<MidiPlayer {midiFiles} {horror} />
</aside>
