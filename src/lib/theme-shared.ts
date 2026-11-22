export type ThemePreference = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_COOKIE_NAME = 'theme';
export const THEME_DARK_BG = '#0a0a0a';
export const THEME_LIGHT_BG = '#fafafa';

// Routes outside the main site keep their own fixed palettes regardless of theme preference.
export const FIXED_PALETTE_PATH_PATTERN = /^\/(silly|bookclub|streaming)(\/|$)/;

const PRINT_RESET_CSS =
	'@media print{html,body{color-scheme:light!important;background-color:#fff!important;color:#000!important}}';

export function isFixedPalettePath(pathname: string): boolean {
	return FIXED_PALETTE_PATH_PATTERN.test(pathname);
}

export function parseThemePreference(value: string | null | undefined): ThemePreference | null {
	return value === 'light' || value === 'dark' ? value : null;
}

/**
 * Injects initial theme attributes, color-scheme metadata, and critical background CSS into the
 * SSR HTML chunk so refreshes in dark or light mode paint the target surface before external
 * stylesheets or client scripts run.
 */
export function applyThemeToHtml(
	html: string,
	pathname: string,
	cookieValue: string | null | undefined
): string {
	const fixedPalette = isFixedPalettePath(pathname);
	const theme = fixedPalette ? null : parseThemePreference(cookieValue);

	let htmlTag = '<html lang="en">';
	let headInjection = '<meta name="color-scheme" content="light" />';

	if (!fixedPalette) {
		if (theme === 'dark') {
			htmlTag = `<html lang="en" class="dark" style="color-scheme: dark; background-color: ${THEME_DARK_BG};">`;
			headInjection =
				'<meta name="color-scheme" content="dark" />' +
				`<style>html.dark,html.dark body{color-scheme:dark;background-color:${THEME_DARK_BG};color:#f5f5f5}${PRINT_RESET_CSS}</style>`;
		} else if (theme === 'light') {
			htmlTag = `<html lang="en" class="light" style="color-scheme: light; background-color: ${THEME_LIGHT_BG};">`;
			headInjection =
				'<meta name="color-scheme" content="light" />' +
				`<style>html.light,html.light body{color-scheme:light;background-color:${THEME_LIGHT_BG};color:#171717}${PRINT_RESET_CSS}</style>`;
		} else {
			headInjection =
				'<meta name="color-scheme" content="light dark" />' +
				`<style>html.dark,html.dark body{color-scheme:dark;background-color:${THEME_DARK_BG};color:#f5f5f5}@media (prefers-color-scheme:dark){html:not(.light),html:not(.light) body{color-scheme:dark;background-color:${THEME_DARK_BG};color:#f5f5f5}}${PRINT_RESET_CSS}</style>`;
		}
	}

	return html
		.replace('<html lang="en">', htmlTag)
		.replace('<meta name="color-scheme" content="light dark" />', headInjection);
}
