<script lang="ts">
	import type { SoundFontPlayer } from '@magenta/music';

	let {
		midiFiles,
		class: tailwind = '',
	}: {
		midiFiles: Record<string, unknown>,
		class?: string,
	} = $props();

	let isPlaying = $state(false);
	let midiPlayer: SoundFontPlayer | null = null;
	let currentMidiUrl = $state<string | null>(null);

	const midiList = Object.entries(midiFiles).map(([path, url]) => ({
		name: path.split('/').pop()?.replace('.mid', '') || '',
		url: url as string
	}));

	function getRandomMidi() {
		const randomIndex = Math.floor(Math.random() * midiList.length);
		return midiList[randomIndex];
	}

	async function playRandomSong() {
		let midi = getRandomMidi();
		while (midi.url === currentMidiUrl && midiList.length > 1) {
			// Ensure a different song is selected
			midi = getRandomMidi();
		}
		currentMidiUrl = midi.url;
		await playSong();
	}

	async function playSong() {
		if (!midiPlayer) {
			const { SoundFontPlayer } = await import('@magenta/music');
			midiPlayer = new SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
		}

		if (currentMidiUrl) {
			try {
				const response = await fetch(currentMidiUrl);
				const arrayBuffer = await response.arrayBuffer();

				const { midiToSequenceProto } = await import('@magenta/music/esm/core/midi_io');
				const ns = midiToSequenceProto(new Uint8Array(arrayBuffer));

				await midiPlayer.loadSamples(ns);
				midiPlayer.start(ns).then(() => {
					// Song ended, play next random song
					if (isPlaying) {
						playRandomSong();
					}
				});
				isPlaying = true;
			} catch (error) {
				console.error('Failed to play MIDI:', error);
			}
		}
	}

	async function togglePlay() {
		if (!midiPlayer) {
			// First time - start with random song
			await playRandomSong();
		} else if (isPlaying) {
			midiPlayer.stop();
			isPlaying = false;
		} else {
			await playSong();
		}
	}

	async function skipSong() {
		if (midiPlayer && isPlaying) {
			midiPlayer.stop();
		}
		await playRandomSong();
	}
</script>

<div class="bg-gradient-to-b from-[#ff00ff] to-[#8b008b] border-4 border-black p-4 text-center {tailwind}" style="box-shadow: 4px 4px 0 #000;">
	<p class="text-yellow-300 font-bold mb-2 text-sm">♫ MIDI MUSIC ♫</p>
	<div class="flex gap-2 justify-center">
		<button
			onclick={togglePlay}
			class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-1 py-1 text-sm font-bold hover:from-[#e0e0e0]"
			style="box-shadow: 2px 2px 0 #000;">
			{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
		</button>
		<button
			onclick={skipSong}
			disabled={!isPlaying}
			class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-1 py-1 text-sm font-bold hover:from-[#e0e0e0] disabled:opacity-50"
			style="box-shadow: 2px 2px 0 #000;">
			⏭ SKIP
		</button>
	</div>
</div>
