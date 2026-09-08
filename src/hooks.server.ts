import type { Handle } from '@sveltejs/kit';

const PROD_HOST = 'ramisbhatty.com';

export const handle: Handle = async ({ event, resolve }) => {
	const host = event.url.hostname;
	if (host !== PROD_HOST && host.endsWith('.pages.dev')) {
		const target = new URL(event.url);
		target.protocol = 'https:';
		target.hostname = PROD_HOST;
		return new Response(null, {
			status: 308,
			headers: { location: target.toString() }
		});
	}
	return resolve(event);
};
