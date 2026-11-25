export interface CrtAudioController {
	start: () => Promise<boolean>;
	stop: () => void;
}

export function createCrtAudioController(): CrtAudioController {
	let context: AudioContext | null = null;
	let masterGain: GainNode | null = null;
	let stopNodes: (() => void) | null = null;

	function stop() {
		const cleanup = stopNodes;
		const activeContext = context;
		const gain = masterGain;

		stopNodes = null;
		context = null;
		masterGain = null;

		if (gain && activeContext) {
			try {
				gain.gain.cancelScheduledValues(activeContext.currentTime);
				gain.gain.setValueAtTime(0, activeContext.currentTime);
			} catch {
				// Ignore teardown errors when the context is already closed.
			}
		}

		if (cleanup) {
			try {
				cleanup();
			} catch {
				// Ignore node stop errors.
			}
		}

		if (activeContext && activeContext.state !== 'closed') {
			void activeContext.close().catch(() => {});
		}
	}

	async function start(): Promise<boolean> {
		if (typeof window === 'undefined') return false;
		const AudioCtx =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioCtx) return false;

		stop();

		try {
			const audioContext = new AudioCtx();
			if (audioContext.state === 'suspended') {
				await audioContext.resume();
			}

			const master = audioContext.createGain();
			master.gain.setValueAtTime(0, audioContext.currentTime);
			master.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.15);
			master.connect(audioContext.destination);

			// Mains CRT hum (58 Hz + faint 116 Hz harmonic) softly low-passed.
			const lowPass = audioContext.createBiquadFilter();
			lowPass.type = 'lowpass';
			lowPass.frequency.value = 210;
			lowPass.connect(master);

			const humFundamental = audioContext.createOscillator();
			humFundamental.type = 'sine';
			humFundamental.frequency.value = 58;
			const humGain = audioContext.createGain();
			humGain.gain.value = 0.026;
			humFundamental.connect(humGain);
			humGain.connect(lowPass);

			const humHarmonic = audioContext.createOscillator();
			humHarmonic.type = 'triangle';
			humHarmonic.frequency.value = 116;
			const harmonicGain = audioContext.createGain();
			harmonicGain.gain.value = 0.01;
			humHarmonic.connect(harmonicGain);
			harmonicGain.connect(lowPass);

			// Gentle tape hiss modulated by a slow flutter LFO.
			const sampleCount = audioContext.sampleRate * 2;
			const noiseBuffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
			const samples = noiseBuffer.getChannelData(0);
			for (let index = 0; index < sampleCount; index += 1) {
				samples[index] = Math.random() * 2 - 1;
			}

			const noiseSource = audioContext.createBufferSource();
			noiseSource.buffer = noiseBuffer;
			noiseSource.loop = true;

			const bandPass = audioContext.createBiquadFilter();
			bandPass.type = 'bandpass';
			bandPass.frequency.value = 1350;
			bandPass.Q.value = 0.9;

			const hissGain = audioContext.createGain();
			hissGain.gain.value = 0.015;

			const flutterLfo = audioContext.createOscillator();
			flutterLfo.type = 'sine';
			flutterLfo.frequency.value = 0.35;
			const flutterDepth = audioContext.createGain();
			flutterDepth.gain.value = 0.004;
			flutterLfo.connect(flutterDepth);
			flutterDepth.connect(hissGain.gain);

			noiseSource.connect(bandPass);
			bandPass.connect(hissGain);
			hissGain.connect(master);

			humFundamental.start();
			humHarmonic.start();
			noiseSource.start();
			flutterLfo.start();

			context = audioContext;
			masterGain = master;
			stopNodes = () => {
				humFundamental.stop();
				humHarmonic.stop();
				noiseSource.stop();
				flutterLfo.stop();
			};
			return true;
		} catch {
			stop();
			return false;
		}
	}

	return { start, stop };
}
