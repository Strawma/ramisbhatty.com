import { parseSillyHorrorPreference, SILLY_HORROR_STORAGE_KEY } from './silly-horror-data';

function readStoredHorrorPreference(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return parseSillyHorrorPreference(window.localStorage.getItem(SILLY_HORROR_STORAGE_KEY));
	} catch {
		return false;
	}
}

function writeStoredHorrorPreference(enabled: boolean): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(SILLY_HORROR_STORAGE_KEY, enabled ? '1' : '0');
	} catch {
		// Storage can be blocked in private browsing or restricted contexts; keep in-memory state.
	}
}

function createSillyTheme() {
	let isHorror = $state(false);

	return {
		get isHorror() {
			return isHorror;
		},
		syncFromStorage() {
			isHorror = readStoredHorrorPreference();
		},
		setHorror(enabled: boolean) {
			isHorror = enabled;
			writeStoredHorrorPreference(enabled);
		},
		toggle() {
			this.setHorror(!isHorror);
		}
	};
}

export const sillyTheme = createSillyTheme();
