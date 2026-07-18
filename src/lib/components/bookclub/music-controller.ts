import backgroundMusicUrl from '$lib/assets/audio/bmbmt-background.mp3';
import {
	DEFAULT_MUSIC_VOLUME,
	loadAudioPreferences,
	saveAudioPreferences
} from './audio-preferences';

export type MusicStatus = 'off' | 'playing' | 'paused' | 'unavailable';

export interface MusicSnapshot {
	status: MusicStatus;
	enabled: boolean;
	volume: number;
}

let audio: HTMLAudioElement | null = null;
let snapshot: MusicSnapshot = {
	status: 'off',
	enabled: false,
	volume: DEFAULT_MUSIC_VOLUME
};
const listeners = new Set<(nextSnapshot: MusicSnapshot) => void>();

function notify(): void {
	for (const listener of listeners) listener(snapshot);
}

function update(nextSnapshot: Partial<MusicSnapshot>): void {
	snapshot = { ...snapshot, ...nextSnapshot };
	notify();
}

function savePreferences(): void {
	const preferences = loadAudioPreferences();
	saveAudioPreferences({
		soundsEnabled: preferences.soundsEnabled,
		musicEnabled: snapshot.enabled,
		musicVolume: snapshot.volume
	});
}

export function initializeMusic(): void {
	if (typeof window === 'undefined') return;

	if (!audio) {
		const preferences = loadAudioPreferences();
		audio = new Audio(backgroundMusicUrl);
		audio.loop = true;
		audio.preload = 'none';
		audio.volume = preferences.musicVolume;
		audio.addEventListener('error', () => update({ status: 'unavailable' }));
		update({ enabled: preferences.musicEnabled, volume: preferences.musicVolume });
	}
}

export function getMusicSnapshot(): MusicSnapshot {
	return snapshot;
}

export function subscribeToMusic(listener: (nextSnapshot: MusicSnapshot) => void): () => void {
	listeners.add(listener);
	listener(snapshot);
	return () => listeners.delete(listener);
}

export async function toggleMusic(): Promise<void> {
	if (!audio) return;

	if (snapshot.enabled && !audio.paused) {
		audio.pause();
		update({ enabled: false, status: 'paused' });
		savePreferences();
		return;
	}

	await startMusic();
}

export async function startMusic(): Promise<boolean> {
	if (!audio) return false;

	try {
		await audio.play();
		update({ enabled: true, status: 'playing' });
		savePreferences();
		return true;
	} catch {
		// Autoplay can be rejected even when the saved preference is enabled.
		update({ enabled: true, status: 'paused' });
		savePreferences();
		return false;
	}
}

export function setMusicVolume(volume: number): void {
	if (!Number.isFinite(volume) || volume < 0 || volume > 1) return;

	if (audio) audio.volume = volume;
	update({ volume });
	savePreferences();
}
