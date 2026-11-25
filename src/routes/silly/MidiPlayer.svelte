<script lang="ts">
	// MIDI is loaded lazily because the audio library and files are only useful after user input.
	let {
		midiFiles,
		class: tailwind = '',
		horror = false
	}: {
		midiFiles: Record<string, unknown>;
		class?: string;
		horror?: boolean;
	} = $props();

	interface MidiEvent {
		t: number;
		m: number[];
	}

	interface TinySynth {
		getAudioContext: () => AudioContext;
		loadMIDI: (data: Uint8Array) => void;
		playMIDI: () => void;
		stopMIDI: () => void;
		locateMIDI: (tick: number) => void;
		setMasterVol: (vol: number) => void;
		getPlayStatus: () => { play: boolean; curTick: number; maxTick: number };
		ready: () => Promise<void>;
		song?: { tempo: number; timebase: number; ev: MidiEvent[] };
		tick2Time?: number;
		send?: (msg: number[], time?: number) => void;
	}

	let synth = $state<TinySynth | null>(null);
	let currentMidiUrl = $state<string | null>(null);
	let isPlaying = $state<boolean>(false);
	let isLoading = $state<boolean>(false);
	let volume = $state<number>(0.25);

	let playbackInterval: number | undefined;
	let wobbleInterval: number | undefined;
	let baseTempo = 120;
	let baseTempoEvents: { event: MidiEvent; tempo: number }[] = [];
	let wobblePhase = 0;

	const midiList = $derived(
		Object.entries(midiFiles).map(([path, url]) => ({
			name: path.split('/').pop()?.replace('.mid', '') || 'Unknown',
			url: url as string
		}))
	);

	function sendPitchBendAllChannels(s: TinySynth, value: number) {
		if (!s.send) return;
		const clamped = Math.max(0, Math.min(16383, Math.round(value)));
		const lsb = clamped & 0x7f;
		const msb = (clamped >> 7) & 0x7f;
		for (let ch = 0; ch < 16; ch += 1) {
			s.send([0xe0 | ch, lsb, msb]);
		}
	}

	function stopWobble(s: TinySynth | null) {
		if (wobbleInterval) {
			clearInterval(wobbleInterval);
			wobbleInterval = undefined;
		}
		if (s) sendPitchBendAllChannels(s, 8192);
	}

	function snapshotTrackTempo(s: TinySynth) {
		baseTempo = s.song?.tempo ?? 120;
		baseTempoEvents = [];
		for (const event of s.song?.ev ?? []) {
			if (event.m[0] === 0xff51 && typeof event.m[1] === 'number') {
				baseTempoEvents.push({ event, tempo: event.m[1] });
			}
		}
	}

	function applyHorrorModulation(s: TinySynth, enabled: boolean) {
		const scale = enabled ? 0.68 : 1;
		if (s.song && s.song.timebase > 0) {
			for (const { event, tempo } of baseTempoEvents) {
				event.m[1] = tempo * scale;
			}
			s.song.tempo = baseTempo * scale;
			s.tick2Time = (4 * 60) / s.song.tempo / s.song.timebase;
		}

		stopWobble(s);
		if (enabled) {
			sendPitchBendAllChannels(s, 5200);
			wobbleInterval = window.setInterval(() => {
				wobblePhase += 0.45;
				sendPitchBendAllChannels(s, 5200 + Math.sin(wobblePhase) * 420);
			}, 250);
		}
	}

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
			snapshotTrackTempo(s);
			applyHorrorModulation(s, horror);
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
			applyHorrorModulation(synth, horror);
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
		if (synth && currentMidiUrl) {
			applyHorrorModulation(synth, horror);
		}
	});

	$effect(() => {
		return () => {
			// Audio and polling must stop when the route is destroyed or the player is replaced.
			stopMonitoring();
			stopWobble(synth);
			if (synth) synth.stopMIDI();
		};
	});
</script>

<div
	class="p-4 text-center select-none {horror
		? 'silly-horror-panel'
		: 'border-4 border-black bg-gradient-to-b from-[#ff00ff] to-[#8b008b]'} {tailwind}"
	style={horror ? undefined : 'box-shadow: 4px 4px 0 #000;'}
	aria-busy={isLoading}
>
	<p class="mb-2 text-sm font-bold drop-shadow-md {horror ? 'text-red-400' : 'text-yellow-300'}">
		{horror ? '▓ TAPE DECK [SP] ▓' : '♫ MIDI MUSIC ♫'}
	</p>
	<p class="sr-only" role="status" aria-live="polite">
		{isLoading ? 'Loading MIDI music' : isPlaying ? 'MIDI music playing' : 'MIDI music paused'}
	</p>

	<!-- Controls -->
	<div class="mb-3 flex justify-center gap-2">
		<button
			onclick={togglePlay}
			disabled={isLoading}
			aria-pressed={isPlaying}
			class="min-w-[80px] px-3 py-1 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {horror
				? 'silly-horror-btn focus-visible:outline-red-400'
				: 'cursor-pointer border-2 border-black bg-gradient-to-b from-[#c0c0c0] to-[#808080] hover:from-[#e0e0e0] focus-visible:outline-yellow-300 active:translate-y-[1px] active:border-t-black active:border-l-black'}"
			style={horror ? undefined : 'box-shadow: 2px 2px 0 #000;'}
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
			aria-label="Skip to another MIDI song"
			class="px-3 py-1 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {horror
				? 'silly-horror-btn focus-visible:outline-red-400'
				: 'cursor-pointer border-2 border-black bg-gradient-to-b from-[#c0c0c0] to-[#808080] hover:from-[#e0e0e0] focus-visible:outline-yellow-300 active:translate-y-[1px] active:border-t-black active:border-l-black'}"
			style={horror ? undefined : 'box-shadow: 2px 2px 0 #000;'}
		>
			⏭ SKIP
		</button>
	</div>

	<!-- Volume Slider -->
	<div class="flex items-center justify-center gap-2 text-xs font-bold text-white">
		<label for="midi-volume">VOL:</label>
		<input
			id="midi-volume"
			type="range"
			min="0"
			max="0.6"
			step="0.01"
			value={volume}
			oninput={updateVolume}
			class="w-24 cursor-pointer {horror ? 'accent-red-500' : 'accent-yellow-300'}"
			aria-valuetext={`${Math.round((volume / 0.6) * 100)} percent`}
		/>
	</div>
</div>
