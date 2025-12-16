<script lang="ts">
	// 1. Define Props
	let {
		midiFiles,
		class: tailwind = ''
	}: {
		midiFiles: Record<string, unknown>;
		class?: string;
	} = $props();

	// 2. Interfaces
	interface TinySynth {
		getAudioContext: () => AudioContext;
		loadMIDI: (data: Uint8Array) => void;
		playMIDI: () => void;
		stopMIDI: () => void;
		locateMIDI: (tick: number) => void;
		setMasterVol: (vol: number) => void; // <--- The function we need
		getPlayStatus: () => { play: boolean; curTick: number; maxTick: number };
		ready: () => Promise<void>;
	}

	// 3. State Management
	let synth = $state<TinySynth | null>(null);
	let currentMidiUrl = $state<string | null>(null);
	let isPlaying = $state<boolean>(false);
	let isLoading = $state<boolean>(false);
	let volume = $state<number>(0.25);

	let playbackInterval: number | undefined;

	const midiList = Object.entries(midiFiles).map(([path, url]) => ({
		name: path.split('/').pop()?.replace('.mid', '') || 'Unknown',
		url: url as string
	}));

	// 4. Initialization
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
		let midi = getRandomMidi();
		if (!midi) return;
		while (midi.url === currentMidiUrl && midiList.length > 1) {
			midi = getRandomMidi();
		}
		if (midi) await loadAndPlay(midi.url);
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
			// Ensure volume is enforced on every load (just in case)
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
			stopMonitoring();
			if (synth) synth.stopMIDI();
		};
	});
</script>

<div
	class="bg-gradient-to-b from-[#ff00ff] to-[#8b008b] border-4 border-black p-4 text-center select-none {tailwind}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<p class="text-yellow-300 font-bold mb-2 text-sm drop-shadow-md">♫ MIDI MUSIC ♫</p>

	<!-- Controls -->
	<div class="flex gap-2 justify-center mb-3">
		<button
			onclick={togglePlay}
			disabled={isLoading}
			class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-3 py-1 text-sm font-bold
				   hover:from-[#e0e0e0] active:border-t-black active:border-l-black active:translate-y-[1px]
				   disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[80px]"
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
			class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-3 py-1 text-sm font-bold
				   hover:from-[#e0e0e0] active:border-t-black active:border-l-black active:translate-y-[1px]
				   disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			style="box-shadow: 2px 2px 0 #000;"
		>
			⏭ SKIP
		</button>
	</div>

	<!-- Volume Slider -->
	<div class="flex items-center justify-center gap-2 text-white text-xs font-bold">
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