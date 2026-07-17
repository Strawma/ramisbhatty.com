<script lang="ts">
	// MIDI is loaded lazily because the audio library and files are only useful after user input.
	let {
		midiFiles,
		class: tailwind = ''
	}: {
		midiFiles: Record<string, unknown>;
		class?: string;
	} = $props();

	interface TinySynth {
		getAudioContext: () => AudioContext;
		loadMIDI: (data: Uint8Array) => void;
		playMIDI: () => void;
		stopMIDI: () => void;
		locateMIDI: (tick: number) => void;
		setMasterVol: (vol: number) => void;
		getPlayStatus: () => { play: boolean; curTick: number; maxTick: number };
		ready: () => Promise<void>;
	}

	let synth = $state<TinySynth | null>(null);
	let currentMidiUrl = $state<string | null>(null);
	let isPlaying = $state<boolean>(false);
	let isLoading = $state<boolean>(false);
	let volume = $state<number>(0.25);

	let playbackInterval: number | undefined;

	const midiList = $derived(
		Object.entries(midiFiles).map(([path, url]) => ({
			name: path.split('/').pop()?.replace('.mid', '') || 'Unknown',
			url: url as string
		}))
	);

	async function initSynth() {
		if (synth) return synth;

		// @ts-expect-error - library import
		const module = await import('webaudio-tinysynth');
		const WebAudioTinySynth = module.default || module;

		synth = new WebAudioTinySynth({
			quality: 0,
			useReverb: 1,
			voices: 64
		});
		if (synth) synth.setMasterVol(volume);

		return synth;
	}

	function getRandomMidi() {
		if (midiList.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * midiList.length);
		return midiList[randomIndex];
	}

	async function playRandomSong() {
		const initialMidi = getRandomMidi();
		if (!initialMidi) return;

		let midi = initialMidi;
		while (midi.url === currentMidiUrl && midiList.length > 1) {
			const nextMidi = getRandomMidi();
			if (!nextMidi) return;
			midi = nextMidi;
		}
		await loadAndPlay(midi.url);
	}

	async function loadAndPlay(url: string) {
		isLoading = true;
		stopMonitoring();

		const s = await initSynth();
		if (!s) return;

		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();

			const ac = s.getAudioContext();
			if (ac.state === 'suspended') await ac.resume();

			s.stopMIDI();
			// Loading a new MIDI can reset synth state, so reapply the current volume.
			s.setMasterVol(volume);

			s.loadMIDI(new Uint8Array(arrayBuffer));
			s.playMIDI();

			currentMidiUrl = url;
			isPlaying = true;
			startMonitoring(s);
		} catch (error) {
			console.error('MIDI Load Error:', error);
		} finally {
			isLoading = false;
		}
	}

	function startMonitoring(s: TinySynth) {
		// TinySynth does not expose a completion event, so poll its tick position and choose the next
		// track when the current one reaches its end.
		playbackInterval = window.setInterval(() => {
			const status = s.getPlayStatus();
			if (isPlaying !== status.play) isPlaying = status.play;
			if (status.play && status.maxTick > 0 && status.curTick >= status.maxTick) {
				playRandomSong();
			}
		}, 200);
	}

	function stopMonitoring() {
		if (playbackInterval) {
			clearInterval(playbackInterval);
			playbackInterval = undefined;
		}
	}

	async function togglePlay() {
		if (!synth) {
			await playRandomSong();
			return;
		}
		const ac = synth.getAudioContext();
		if (ac.state === 'suspended') await ac.resume();

		if (isPlaying) {
			synth.stopMIDI();
			isPlaying = false;
		} else {
			synth.playMIDI();
			isPlaying = true;
		}
	}

	function skipSong() {
		playRandomSong();
	}

	function updateVolume(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseFloat(target.value);
		if (synth) {
			synth.setMasterVol(volume);
		}
	}

	$effect(() => {
		return () => {
			// Audio and polling must stop when the route is destroyed or the player is replaced.
			stopMonitoring();
			if (synth) synth.stopMIDI();
		};
	});
</script>

<div
	class="border-4 border-black bg-gradient-to-b from-[#ff00ff] to-[#8b008b] p-4 text-center select-none {tailwind}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<p class="mb-2 text-sm font-bold text-yellow-300 drop-shadow-md">♫ MIDI MUSIC ♫</p>

	<!-- Controls -->
	<div class="mb-3 flex justify-center gap-2">
		<button
			onclick={togglePlay}
			disabled={isLoading}
			class="min-w-[80px] cursor-pointer border-2 border-black bg-gradient-to-b from-[#c0c0c0] to-[#808080] px-3 py-1
				   text-sm font-bold hover:from-[#e0e0e0] active:translate-y-[1px]
				   active:border-t-black active:border-l-black disabled:cursor-not-allowed disabled:opacity-50"
			style="box-shadow: 2px 2px 0 #000;"
		>
			{#if isLoading}
				...
			{:else}
				{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
			{/if}
		</button>

		<button
			onclick={skipSong}
			disabled={!currentMidiUrl}
			class="cursor-pointer border-2 border-black bg-gradient-to-b from-[#c0c0c0] to-[#808080] px-3 py-1 text-sm
				   font-bold hover:from-[#e0e0e0] active:translate-y-[1px] active:border-t-black
				   active:border-l-black disabled:cursor-not-allowed disabled:opacity-50"
			style="box-shadow: 2px 2px 0 #000;"
		>
			⏭ SKIP
		</button>
	</div>

	<!-- Volume Slider -->
	<div class="flex items-center justify-center gap-2 text-xs font-bold text-white">
		<span>VOL:</span>
		<input
			type="range"
			min="0"
			max="0.6"
			step="0.01"
			value={volume}
			oninput={updateVolume}
			class="w-24 cursor-pointer accent-yellow-300"
		/>
	</div>
</div>
