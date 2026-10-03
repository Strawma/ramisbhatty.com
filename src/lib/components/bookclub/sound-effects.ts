import { loadAudioPreferences, saveAudioPreferences } from './audio-preferences';

export interface SoundEffectsSnapshot {
	enabled: boolean;
	unavailable: boolean;
}

let audioContext: AudioContext | null = null;
let snapshot: SoundEffectsSnapshot = { enabled: false, unavailable: false };
let unlockListenersAttached = false;
const listeners = new Set<(nextSnapshot: SoundEffectsSnapshot) => void>();

function notify(): void {
	for (const listener of listeners) listener(snapshot);
}

function update(nextSnapshot: Partial<SoundEffectsSnapshot>): void {
	snapshot = { ...snapshot, ...nextSnapshot };
	notify();
}

function savePreference(): void {
	const preferences = loadAudioPreferences();
	saveAudioPreferences({
		soundsEnabled: snapshot.enabled,
		musicEnabled: preferences.musicEnabled,
		musicVolume: preferences.musicVolume
	});
}

function detachUnlockListeners(): void {
	if (typeof window === 'undefined' || !unlockListenersAttached) return;

	window.removeEventListener('pointerdown', unlockAudio);
	window.removeEventListener('keydown', unlockAudio);
	unlockListenersAttached = false;
}

function unlockAudio(): void {
	if (!snapshot.enabled || audioContext?.state === 'running') {
		detachUnlockListeners();
		return;
	}

	void resumeAudioContext().then((ready) => {
		if (ready) detachUnlockListeners();
	});
}

function attachUnlockListeners(): void {
	if (typeof window === 'undefined' || unlockListenersAttached) return;

	unlockListenersAttached = true;
	window.addEventListener('pointerdown', unlockAudio);
	window.addEventListener('keydown', unlockAudio);
}

function createAudioContext(): AudioContext | null {
	if (audioContext) return audioContext;

	try {
		audioContext = new AudioContext();
		return audioContext;
	} catch {
		audioContext = null;
		update({ enabled: false, unavailable: true });
		return null;
	}
}

async function resumeAudioContext(): Promise<boolean> {
	const context = createAudioContext();
	if (!context) return false;

	try {
		if (context.state !== 'running') await context.resume();
	} catch {
		update({ unavailable: true });
		return false;
	}

	return context.state === 'running';
}

export function initializeSoundEffects(): void {
	if (typeof window === 'undefined') return;

	const preferences = loadAudioPreferences();
	update({ enabled: preferences.soundsEnabled });
	if (preferences.soundsEnabled) attachUnlockListeners();
}

export function getSoundEffectsSnapshot(): SoundEffectsSnapshot {
	return snapshot;
}

export function subscribeToSoundEffects(
	listener: (nextSnapshot: SoundEffectsSnapshot) => void
): () => void {
	listeners.add(listener);
	listener(snapshot);
	return () => listeners.delete(listener);
}

export function getSoundEffectsContext(): AudioContext | null {
	return audioContext;
}

export async function ensureSoundEffects(): Promise<boolean> {
	const ready = await resumeAudioContext();
	update({ unavailable: !ready });
	return ready;
}

export async function toggleSoundEffects(): Promise<void> {
	if (snapshot.enabled) {
		update({ enabled: false });
		savePreference();
		detachUnlockListeners();
		return;
	}

	attachUnlockListeners();
	const ready = await ensureSoundEffects();
	update({ enabled: ready });
	if (ready) playSoundTone(660, 0.12, 0, 'sine');
	savePreference();
}

export function playSoundTone(
	frequency: number,
	duration: number,
	delay: number,
	type: OscillatorType
): void {
	if (!audioContext || audioContext.state !== 'running') return;

	const start = audioContext.currentTime + delay;
	const oscillator = audioContext.createOscillator();
	const gain = audioContext.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, start);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	oscillator.connect(gain).connect(audioContext.destination);
	oscillator.start(start);
	oscillator.stop(start + duration + 0.02);
}

export function disposeSoundEffects(): void {
	detachUnlockListeners();

	if (audioContext) {
		void audioContext.close().catch(() => {});
		audioContext = null;
	}
}
