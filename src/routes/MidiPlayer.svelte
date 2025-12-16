<script lang="ts">
	// 1. Define Props
	let {
		midiFiles,
		class: tailwind = ''
	}: {
		midiFiles: Record<string, unknown>;
		class?: string;
	} = $props();

	// 2. Interfaces for the external library (Clean up 'any')
	interface TinySynth {
		getAudioContext: () => AudioContext;
		loadMIDI: (data: Uint8Array) => void;
		playMIDI: () => void;
		stopMIDI: () => void;
		setMasterVol: (vol: number) => void;
		getPlayStatus: () => { cur: number; max: number }; // Returns seconds (or ticks)
		ready: () => Promise<void>;
	}

	// 3. State Management
	let synth = $state<TinySynth | null>(null);
	let currentMidiUrl = $state<string | null>(null);
	let isPlaying = $state<boolean>(false);
	let isLoading = $state<boolean>(false);
	let playbackInterval: number | undefined;

	// Convert glob import to usable array
	const midiList = Object.entries(midiFiles).map(([path, url]) => ({
		name: path.split('/').pop()?.replace('.mid', '') || 'Unknown',
		url: url as string
	}));

	// 4. Initialization
	async function initSynth() {
		if (synth) return synth;

		// Dynamic import
		// @ts-expect-error - Library often lacks definition files
		const module = await import('webaudio-tinysynth');
		const WebAudioTinySynth = module.default || module;

		synth = new WebAudioTinySynth({
			quality: 0,
			useReverb: 1,
			voices: 64
		});

		return synth;
	}

	function getRandomMidi() {
		if (midiList.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * midiList.length);
		return midiList[randomIndex];
	}

	// 5. Playback Logic
	async function playRandomSong() {
		let midi = getRandomMidi();
		if (!midi) return;

		// Avoid repeating the same song immediately if others exist
		while (midi.url === currentMidiUrl && midiList.length > 1) {
			midi = getRandomMidi();
		}

		if (midi) await loadAndPlay(midi.url);
	}

	async function loadAndPlay(url: string) {
		isLoading = true;
		stopMonitoring(); // Stop checking previous song status

		const s = await initSynth();
		if (!s) return;

		try {
			// Fetch and Load
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();

			// Handle Audio Context (Browser Autoplay Policy)
			const ac = s.getAudioContext();
			if (ac.state === 'suspended') {
				await ac.resume();
			}

			s.stopMIDI(); // Stop previous
			s.loadMIDI(new Uint8Array(arrayBuffer));
			s.playMIDI();

			currentMidiUrl = url;
			isPlaying = true;

			// Start monitoring for end-of-song
			startMonitoring(s);

		} catch (error) {
			console.error('MIDI Load Error:', error);
		} finally {
			isLoading = false;
		}
	}

	// 6. Monitoring (The "Auto-Play Next" Logic)
	function startMonitoring(s: TinySynth) {
		// Poll every second to see if song finished
		playbackInterval = window.setInterval(() => {
			const status = s.getPlayStatus();

			// Note: status.cur is current ticks/time, status.max is total
			// We add a tiny buffer check or check if strictly equal/greater
			if (status && status.max > 0 && status.cur >= status.max) {
				console.log('Song ended, skipping to next...');
				playRandomSong();
			}
		}, 1000);
	}

	function stopMonitoring() {
		if (playbackInterval) {
			clearInterval(playbackInterval);
			playbackInterval = undefined;
		}
	}

	// 7. Controls
	async function togglePlay() {
		if (!synth) {
			await playRandomSong();
			return;
		}

		const ac = synth.getAudioContext();

		if (ac.state === 'running') {
			await ac.suspend();
			isPlaying = false;
		} else {
			await ac.resume();
			isPlaying = true;
		}
	}

	function skipSong() {
		playRandomSong();
	}

	// 8. Cleanup on Component Destroy
	$effect(() => {
		return () => {
			stopMonitoring();
			if (synth) {
				synth.stopMIDI();
			}
		};
	});
</script>

<div
	class="bg-gradient-to-b from-[#ff00ff] to-[#8b008b] border-4 border-black p-4 text-center select-none {tailwind}"
	style="box-shadow: 4px 4px 0 #000;"
>
	<p class="text-yellow-300 font-bold mb-2 text-sm drop-shadow-md">♫ MIDI MUSIC ♫</p>

	<div class="flex gap-2 justify-center">
		<!-- Play/Pause -->
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

		<!-- Skip -->
		<button
			onclick={skipSong}
			disabled={!isPlaying && !currentMidiUrl}
			class="bg-gradient-to-b from-[#c0c0c0] to-[#808080] border-2 border-black px-3 py-1 text-sm font-bold
				   hover:from-[#e0e0e0] active:border-t-black active:border-l-black active:translate-y-[1px]
				   disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			style="box-shadow: 2px 2px 0 #000;"
		>
			⏭ SKIP
		</button>
	</div>
</div>