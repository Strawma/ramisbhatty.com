<script lang="ts">
	import { onMount } from 'svelte';

	let { src = '/audio/bmbmt-background.mp3' }: { src?: string } = $props();
	let audio: HTMLAudioElement | null = null;
	let musicState = $state<'off' | 'playing' | 'paused' | 'unavailable'>('off');

	onMount(() => {
		audio = new Audio(src);
		audio.loop = true;
		audio.preload = 'none';
		audio.addEventListener('error', () => (musicState = 'unavailable'));

		return () => {
			audio?.pause();
			audio?.removeAttribute('src');
			audio = null;
		};
	});

	async function toggleMusic(): Promise<void> {
		if (!audio) return;

		if (!audio.paused) {
			audio.pause();
			musicState = 'paused';
			return;
		}

		try {
			await audio.play();
			musicState = 'playing';
		} catch {
			musicState = 'unavailable';
		}
	}

	function musicLabel(): string {
		if (musicState === 'playing') return 'MUSIC: ON';
		if (musicState === 'unavailable') return 'MUSIC: NO TAPE';
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
		<p class="mt-2 text-yellow-300">Add the clubhouse track at /audio/bmbmt-background.mp3.</p>
	{/if}
</div>
