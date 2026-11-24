import type { Handle } from '@sveltejs/kit/hooks';
import { applyThemeToHtml, THEME_COOKIE_NAME } from '#lib/theme-shared.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const themeCookie = event.cookies?.get(THEME_COOKIE_NAME);
	return resolve(event, {
		transformPageChunk: ({ html }) => applyThemeToHtml(html, event.url.pathname, themeCookie)
	});
};
