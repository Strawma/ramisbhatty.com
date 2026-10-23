import type { Handle } from '@sveltejs/kit/hooks';
import { site } from '#lib/data/config.ts';

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
	return resolve(event);
};
