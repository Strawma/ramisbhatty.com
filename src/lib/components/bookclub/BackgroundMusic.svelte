<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getMusicSnapshot,
		initializeMusic,
		setMusicVolume,
		startMusic,
		subscribeToMusic,
		toggleMusic,
		type MusicSnapshot
	} from './music-controller';

	let music = $state<MusicSnapshot>(getMusicSnapshot());
	let musicButton: HTMLButtonElement | null = null;

	onMount(() => {
		initializeMusic();
		const unsubscribe = subscribeToMusic((nextSnapshot) => (music = nextSnapshot));

		const startOnPageClick = (event: MouseEvent) => {
			if (
				!music.enabled ||
				music.status === 'playing' ||
				(event.target instanceof Node && musicButton?.contains(event.target))
			) {
				return;
			}

			void startMusic().then((started) => {
				if (started) window.removeEventListener('click', startOnPageClick);
			});
		};

		if (music.enabled && music.status !== 'playing') {
			window.addEventListener('click', startOnPageClick);
		}

		return () => {
			window.removeEventListener('click', startOnPageClick);
			unsubscribe();
		};
	});

	function musicLabel(): string {
		if (music.status === 'unavailable') return 'MUSIC: NO TAPE';
		if (music.status === 'playing') return 'MUSIC: ON';
		if (music.enabled) return 'MUSIC: READY';
		return 'MUSIC: OFF';
	}
</script>

<div class="mt-3 border-2 border-black bg-black p-2 text-xs text-lime-300">
	<div class="flex items-center justify-between gap-2">
		<span class="font-bold text-white">MUSIC</span>
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
	<label for="background-music-volume" class="mt-2 flex items-center gap-2">
		<span class="shrink-0 font-bold">VOL: {Math.round(music.volume * 100)}%</span>
		<input
			id="background-music-volume"
			type="range"
			min="0"
			max="1"
			step="0.01"
			value={music.volume}
			oninput={(event) => setMusicVolume(Number((event.currentTarget as HTMLInputElement).value))}
			class="min-w-0 flex-1 cursor-pointer accent-lime-300"
		/>
	</label>
	{#if music.status === 'unavailable'}
		<p class="mt-2 text-yellow-300">The clubhouse track could not be loaded.</p>
	{/if}
</div>
