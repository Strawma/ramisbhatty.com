<script lang="ts">
	let {
		midiFiles,
		tailwind = ''
	}: {
		midiFiles: Record<string, unknown>,
		tailwind?: string
	} = $props();

	let isPlaying = $state(false);
	let midiPlayer: any;
	let selectedMidiUrl = $state<string | null>(null);

	const midiList = Object.entries(midiFiles).map(([path, url]) => ({
		name: path.split('/').pop()?.replace('.mid', '') || '',
		url: url as string
	}));

	async function toggleMidi() {
		if (!midiPlayer) {
			const { SoundFontPlayer } = await import('@magenta/music');
			midiPlayer = new SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
		}

		if (isPlaying) {
			midiPlayer.stop();
			isPlaying = false;
		} else {
			if (selectedMidiUrl) {
				try {
					const response = await fetch(selectedMidiUrl);
					const arrayBuffer = await response.arrayBuffer();

					const { midiToSequenceProto } = await import('@magenta/music/esm/core/midi_io');
					const ns = midiToSequenceProto(new Uint8Array(arrayBuffer));

					await midiPlayer.loadSamples(ns);
					midiPlayer.start(ns);
					isPlaying = true;
				} catch (error) {
					console.error('Failed to play MIDI:', error);
				}
			}
		}
	}
</script>

<div class="bg-gradient-to-b from-[#ff00ff] to-[#8b008b] border-4 border-black p-4 text-center {tailwind}" style="box-shadow: 4px 4px 0 #000;">
	<p class="text-yellow-300 font-bold mb-2 text-sm">♪♫ MIDI MUSIC ♫♪</p>
	<select
		bind:value={selectedMidiUrl}
		class="w-full mb-2 p-1 text-xs border-2 border-black"
	>
		<option value={null}>Select a song...</option>
		{#each midiList as midi (midi.url)}
			<option value={midi.url}>{midi.name}</option>
		{/each}
	</select>
	<button
		onclick={toggleMidi}
		disabled={!selectedMidiUrl}
		class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-4 py-2 text-sm font-bold hover:from-[#e0e0e0] disabled:opacity-50"
		style="box-shadow: 2px 2px 0 #000;">
		{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
	</button>
</div>