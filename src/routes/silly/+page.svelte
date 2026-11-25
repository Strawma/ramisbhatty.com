<script lang="ts">
	import { onMount } from 'svelte';
	import RamisSrc from '#lib/assets/images/ramis-pixellated.webp';

	import BouncerManager from '#lib/components/bouncer/BouncerManager.svelte';
	import Bouncer from '#lib/components/bouncer/Bouncer.svelte';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';
	import AdBanner from './AdBanner.svelte';
	import Footer from './Footer.svelte';
	import FactGenerator from './FactGenerator.svelte';
	import Welcome from './Welcome.svelte';
	import { createCrtAudioController } from './crt-audio';
	import { SILLY_HORROR_STORAGE_KEY } from './silly-horror-data';
	import { sillyTheme } from './silly-theme.svelte';
	import './silly-horror.css';

	// Vite turns the bundled MIDI files into URLs. The player fetches the selected file only after
	// the visitor explicitly starts audio playback.
	const midiFiles = import.meta.glob('#lib/assets/midi/*.mid', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	// These are decorative and intentionally randomized per page load, not persisted visitor data.
	const bouncerConfigs = Array.from({ length: 15 }, () => ({
		size: 0.02 + Math.random() * 0.08, // 2%–10% of viewport
		speed: Math.floor(Math.random() * 600) + 300
	}));

	const crtAudio = createCrtAudioController();
	let crtAudioEnabled = $state(false);

	async function toggleCrtAudio() {
		if (crtAudioEnabled) {
			crtAudio.stop();
			crtAudioEnabled = false;
			return;
		}
		crtAudioEnabled = await crtAudio.start();
	}

	onMount(() => {
		sillyTheme.syncFromStorage();
		const handleStorage = (event: StorageEvent) => {
			if (event.key === SILLY_HORROR_STORAGE_KEY || event.key === null) {
				sillyTheme.syncFromStorage();
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => {
			window.removeEventListener('storage', handleStorage);
			crtAudio.stop();
		};
	});

	$effect(() => {
		if (!sillyTheme.isHorror && crtAudioEnabled) {
			crtAudio.stop();
			crtAudioEnabled = false;
		}
	});
</script>

<svelte:head>
	<title>Silly | Ramis Bhatty</title>
	<link rel="icon" href="/silly/favicon.ico" />
	<meta
		name="description"
		content="A deliberately excessive retro corner of Ramis Bhatty's personal website."
	/>
</svelte:head>

<BouncerManager
	fps={8}
	speedMultiplier={sillyTheme.isHorror ? 0.22 : 1}
	canvasFilter={sillyTheme.isHorror
		? 'grayscale(1) contrast(2.2) brightness(0.65) opacity(0.55)'
		: ''}
>
	{#each bouncerConfigs as config, i (i)}
		<Bouncer {...config} imageSrc={RamisSrc} />
	{/each}

	<main
		class="min-h-screen font-['pixel-sans',cursive]"
		class:text-black={!sillyTheme.isHorror}
		class:text-zinc-200={sillyTheme.isHorror}
		class:silly-horror={sillyTheme.isHorror}
		data-silly-mode={sillyTheme.isHorror ? 'horror' : 'normal'}
		style="color-scheme: light; background: {sillyTheme.isHorror
			? 'radial-gradient(circle at top, #1b0508 0%, #050506 70%)'
			: 'linear-gradient(45deg, #ff00ff 0%, #00ff00 25%, #ff0000 50%, #00ffff 75%, #ffff00 100%)'};"
	>
		{#if sillyTheme.isHorror}
			<div class="silly-crt-overlay" aria-hidden="true"></div>
		{/if}

		<div
			class="relative z-20 mx-auto flex min-h-screen max-w-3xl flex-col px-8 {sillyTheme.isHorror
				? 'silly-glitch-shell bg-[#0b0b0d]'
				: 'bg-[#c0c0c0]'}"
		>
			<div class="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
				{#if sillyTheme.isHorror}
					<span class="font-mono tracking-wider text-red-400">● REC · CH-04 · SP</span>
				{:else}
					<span class="font-bold text-neutral-800">CH-04 // RETRO MODE</span>
				{/if}
				<div class="flex flex-wrap items-center gap-2">
					{#if sillyTheme.isHorror}
						<button
							type="button"
							aria-pressed={crtAudioEnabled}
							onclick={toggleCrtAudio}
							class="silly-horror-btn px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
						>
							{crtAudioEnabled ? 'TAPE AUDIO: ON' : 'TAPE AUDIO: OFF'}
						</button>
					{/if}
					<button
						type="button"
						aria-pressed={sillyTheme.isHorror}
						onclick={() => sillyTheme.toggle()}
						class="px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 {sillyTheme.isHorror
							? 'silly-horror-btn focus-visible:outline-red-400'
							: 'retro-btn text-black focus-visible:outline-black'}"
					>
						{sillyTheme.isHorror ? '☀ EXIT BROADCAST' : '☾ DARK MODE'}
					</button>
				</div>
			</div>

			<Header horror={sillyTheme.isHorror} />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Sidebar {midiFiles} horror={sillyTheme.isHorror} />
				<div class="space-y-4 md:col-span-3">
					<Welcome horror={sillyTheme.isHorror} />
					<AdBanner horror={sillyTheme.isHorror} />
				</div>
			</div>

			<hr class="my-4 border {sillyTheme.isHorror ? 'border-red-950' : 'border-black'}" />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<AdBanner size="square" class="md:col-span-2" horror={sillyTheme.isHorror} />
				<FactGenerator class="md:col-span-2" horror={sillyTheme.isHorror} />
			</div>

			<Footer horror={sillyTheme.isHorror} />
		</div>
	</main>
</BouncerManager>

<style>
	@font-face {
		font-family: 'pixel-sans';
		src: url('../../lib/assets/fonts/pixel-comic-sans.ttf') format('truetype');
	}
</style>
