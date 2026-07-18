<script lang="ts">
	import { onMount } from 'svelte';
	import backgroundMusicUrl from '$lib/assets/audio/bmbmt-background.mp3';
	import { loadAudioPreferences, saveAudioPreferences } from './audio-preferences';

	let { src = backgroundMusicUrl }: { src?: string } = $props();
	let audio: HTMLAudioElement | null = null;
	let musicState = $state<'off' | 'playing' | 'paused' | 'unavailable'>('off');
	let musicEnabled = $state(false);

	onMount(() => {
		audio = new Audio(src);
		audio.loop = true;
		audio.preload = 'none';
		audio.volume = 0.3;
		audio.addEventListener('error', () => (musicState = 'unavailable'));
		musicEnabled = loadAudioPreferences().musicEnabled;

		return () => {
			audio?.pause();
			audio?.removeAttribute('src');
			audio = null;
		};
	});

	async function toggleMusic(): Promise<void> {
		if (!audio) return;

		if (musicEnabled && !audio.paused) {
			audio.pause();
			musicEnabled = false;
			musicState = 'paused';
			savePreferences();
			return;
		}

		await startMusic();
	}

	async function startMusic(): Promise<void> {
		if (!audio) return;

		try {
			await audio.play();
			musicEnabled = true;
			musicState = 'playing';
			savePreferences();
		} catch {
			// Autoplay can be rejected even when the saved preference is enabled.
			musicEnabled = true;
			musicState = 'paused';
			savePreferences();
		}
	}

	function savePreferences(): void {
		saveAudioPreferences({ soundsEnabled: loadAudioPreferences().soundsEnabled, musicEnabled });
	}

	function musicLabel(): string {
		if (musicState === 'unavailable') return 'MUSIC: NO TAPE';
		if (musicState === 'playing') return 'MUSIC: ON';
		if (musicEnabled) return 'MUSIC: READY';
		return 'MUSIC: OFF';
	}
</script>

<div class="mt-4 border-2 border-black bg-black p-3 text-xs text-lime-300">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<p class="font-bold text-white">BACKGROUND MUSIC</p>
			<p class="mt-1">Optional clubhouse ambience.</p>
		</div>
		<button
			type="button"
			onclick={toggleMusic}
			class="border-2 border-lime-300 px-2 py-1 font-bold text-lime-300 hover:bg-lime-300 hover:text-black focus:ring-2 focus:ring-white focus:outline-none"
			aria-label="Toggle background music"
		>
			{musicLabel()}
		</button>
	</div>
	{#if musicState === 'unavailable'}
		<p class="mt-2 text-yellow-300">The clubhouse track could not be loaded.</p>
	{/if}
</div>
