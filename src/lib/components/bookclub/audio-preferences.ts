const STORAGE_KEY = 'bookclub-audio-preferences';
export const DEFAULT_MUSIC_VOLUME = 0.3;

export interface AudioPreferences {
	soundsEnabled: boolean;
	musicEnabled: boolean;
	musicVolume: number;
}

const defaultPreferences: AudioPreferences = {
	soundsEnabled: false,
	musicEnabled: false,
	musicVolume: DEFAULT_MUSIC_VOLUME
};

export function loadAudioPreferences(): AudioPreferences {
	if (typeof localStorage === 'undefined') return { ...defaultPreferences };

	try {
		const stored = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? 'null'
		) as Partial<AudioPreferences>;

		return {
			soundsEnabled: stored.soundsEnabled === true,
			musicEnabled: stored.musicEnabled === true,
			musicVolume:
				typeof stored.musicVolume === 'number' &&
				Number.isFinite(stored.musicVolume) &&
				stored.musicVolume >= 0 &&
				stored.musicVolume <= 1
					? stored.musicVolume
					: DEFAULT_MUSIC_VOLUME
		};
	} catch {
		return { ...defaultPreferences };
	}
}

export function saveAudioPreferences(preferences: AudioPreferences): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	} catch {
		// Storage can be unavailable in private or restricted browser contexts.
	}
}
