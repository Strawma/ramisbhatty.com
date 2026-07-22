import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		csrf: {
			// Both custom hostnames belong to this site; keep SvelteKit's origin check enabled for all others.
			trustedOrigins: ['https://ramisbhatty.com', 'https://www.ramisbhatty.com']
		},
		adapter: adapter()
	}
};

export default config;
