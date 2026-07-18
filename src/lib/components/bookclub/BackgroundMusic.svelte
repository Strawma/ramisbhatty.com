<script lang="ts">
	import { onMount } from 'svelte';
	import backgroundMusicUrl from '$lib/assets/audio/bmbmt-background.mp3';
	import {
		DEFAULT_MUSIC_VOLUME,
		loadAudioPreferences,
		saveAudioPreferences
	} from './audio-preferences';

	let { src = backgroundMusicUrl }: { src?: string } = $props();
	let audio: HTMLAudioElement | null = null;
	let musicState = $state<'off' | 'playing' | 'paused' | 'unavailable'>('off');
	let musicEnabled = $state(false);
	let musicVolume = $state(DEFAULT_MUSIC_VOLUME);
	let musicButton: HTMLButtonElement | null = null;

	onMount(() => {
		audio = new Audio(src);
		audio.loop = true;
		audio.preload = 'none';
		audio.addEventListener('error', () => (musicState = 'unavailable'));
		const preferences = loadAudioPreferences();
		musicEnabled = preferences.musicEnabled;
		musicVolume = preferences.musicVolume;
		audio.volume = musicVolume;

		const startOnPageClick = (event: MouseEvent) => {
			if (!musicEnabled || (event.target instanceof Node && musicButton?.contains(event.target))) {
				return;
			}

			void startMusic().then((started) => {
				if (started) window.removeEventListener('click', startOnPageClick);
			});
		};

		if (musicEnabled) window.addEventListener('click', startOnPageClick);

		return () => {
			window.removeEventListener('click', startOnPageClick);
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

	async function startMusic(): Promise<boolean> {
		if (!audio) return false;

		try {
			await audio.play();
			musicEnabled = true;
			musicState = 'playing';
			savePreferences();
			return true;
		} catch {
			// Autoplay can be rejected even when the saved preference is enabled.
			musicEnabled = true;
			musicState = 'paused';
			savePreferences();
			return false;
		}
	}

	function savePreferences(): void {
		saveAudioPreferences({
			soundsEnabled: loadAudioPreferences().soundsEnabled,
			musicEnabled,
			musicVolume
		});
	}

	function updateMusicVolume(event: Event): void {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (!Number.isFinite(value) || value < 0 || value > 1) return;

		musicVolume = value;
		if (audio) audio.volume = value;
		savePreferences();
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
			bind:this={musicButton}
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
	<label for="background-music-volume" class="mt-3 flex items-center gap-2">
		<span class="shrink-0 font-bold">VOLUME: {Math.round(musicVolume * 100)}%</span>
		<input
			id="background-music-volume"
			type="range"
			min="0"
			max="1"
			step="0.01"
			value={musicVolume}
			oninput={updateMusicVolume}
			class="min-w-0 flex-1 cursor-pointer accent-lime-300"
		/>
	</label>
</div>
