export type ThemePreference = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function getStoredTheme(): ThemePreference | null {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return stored === 'light' || stored === 'dark' ? stored : null;
	} catch {
		return null;
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

export function applyDocumentTheme(theme: ThemePreference): void {
	document.documentElement.classList.toggle('dark', theme === 'dark');
	document.documentElement.style.colorScheme = theme;
}

class ThemeState {
	current = $state<ThemePreference>('light');

	get isDark(): boolean {
		return this.current === 'dark';
	}

	syncFromPreference(): void {
		const theme = resolveTheme();
		this.current = theme;
		applyDocumentTheme(theme);
	}

	set(theme: ThemePreference): void {
		this.current = theme;
		applyDocumentTheme(theme);
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
