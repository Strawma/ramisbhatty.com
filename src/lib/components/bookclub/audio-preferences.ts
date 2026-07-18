const STORAGE_KEY = 'bookclub-audio-preferences';

export interface AudioPreferences {
	soundsEnabled: boolean;
	musicEnabled: boolean;
}

const defaultPreferences: AudioPreferences = {
	soundsEnabled: false,
	musicEnabled: false
};

export function loadAudioPreferences(): AudioPreferences {
	if (typeof localStorage === 'undefined') return { ...defaultPreferences };

	try {
		const stored = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? 'null'
		) as Partial<AudioPreferences>;

		return {
			soundsEnabled: stored.soundsEnabled === true,
			musicEnabled: stored.musicEnabled === true
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
