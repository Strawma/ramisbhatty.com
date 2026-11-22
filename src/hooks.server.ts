import type { Handle } from '@sveltejs/kit/hooks';
import { site } from '#lib/data/config.ts';
import { applyThemeToHtml, THEME_COOKIE_NAME } from '#lib/theme-shared.ts';

export const handle: Handle = async ({ event, resolve }) => {
	// Only the production Pages alias redirects; branch and deployment previews stay accessible.
	if (event.url.hostname === site.pagesHostname) {
		const target = new URL(site.origin);
		target.pathname = event.url.pathname;
		target.search = event.url.search;
		return new Response(null, {
			status: 308,
			headers: { location: target.toString() }
		});
	}

	const themeCookie = event.cookies?.get(THEME_COOKIE_NAME);
	return resolve(event, {
		transformPageChunk: ({ html }) => applyThemeToHtml(html, event.url.pathname, themeCookie)
	});
};
