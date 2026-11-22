import {
	parseThemePreference,
	THEME_COOKIE_NAME,
	THEME_DARK_BG,
	THEME_LIGHT_BG,
	THEME_STORAGE_KEY,
	type ThemePreference
} from '#lib/theme-shared.ts';

export { THEME_COOKIE_NAME, THEME_STORAGE_KEY, type ThemePreference };

const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readThemeCookie(): ThemePreference | null {
	try {
		for (const part of document.cookie.split(';')) {
			const [rawKey, ...rawValue] = part.trim().split('=');
			if (rawKey === THEME_COOKIE_NAME) {
				return parseThemePreference(rawValue.join('='));
			}
		}
	} catch {
		// Ignore cookie read failures in restricted contexts.
	}
	return null;
}

function writeThemeCookie(theme: ThemePreference): void {
	try {
		const secure = location.protocol === 'https:' ? '; secure' : '';
		document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
	} catch {
		// The theme still updates via localStorage and DOM state if cookies are blocked.
	}
}

function setColorSchemeMeta(content: 'light' | 'dark' | 'light dark'): void {
	let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
	if (!meta) {
		meta = document.createElement('meta');
		meta.name = 'color-scheme';
		document.head.appendChild(meta);
	}
	meta.content = content;
}

export function getStoredTheme(): ThemePreference | null {
	try {
		return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
	} catch {
		// Fall back to the preference cookie when localStorage is unavailable.
		return readThemeCookie();
	}
}

export function resolveTheme(): ThemePreference {
	const stored = getStoredTheme();
	if (stored) return stored;

	try {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

export function applyDocumentTheme(theme: ThemePreference, explicit = false): void {
	const dark = theme === 'dark';
	document.documentElement.classList.toggle('dark', dark);
	document.documentElement.classList.toggle('light', !dark);
	document.documentElement.style.colorScheme = theme;
	document.documentElement.style.backgroundColor = dark ? THEME_DARK_BG : THEME_LIGHT_BG;
	setColorSchemeMeta(explicit ? theme : 'light dark');
}

export function resetDocumentTheme(): void {
	document.documentElement.classList.remove('dark', 'light');
	document.documentElement.style.colorScheme = 'light';
	document.documentElement.style.backgroundColor = '';
	setColorSchemeMeta('light');
}

class ThemeState {
	current = $state<ThemePreference>('light');

	get isDark(): boolean {
		return this.current === 'dark';
	}

	syncFromPreference(): void {
		const stored = getStoredTheme();
		if (stored) {
			// Backfill the cookie for returning visitors who saved their preference before SSR cookie support.
			writeThemeCookie(stored);
		}
		const theme = stored ?? resolveTheme();
		this.current = theme;
		applyDocumentTheme(theme, stored !== null);
	}

	set(theme: ThemePreference): void {
		this.current = theme;
		applyDocumentTheme(theme, true);
		writeThemeCookie(theme);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// The theme still changes for this page view if storage is unavailable.
		}
	}

	toggle(): void {
		this.set(this.isDark ? 'light' : 'dark');
	}
}

export const mainTheme = new ThemeState();
