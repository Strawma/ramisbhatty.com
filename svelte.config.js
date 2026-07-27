import adapter from '@sveltejs/adapter-cloudflare';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],

	kit: {
		csrf: {
			// Both custom hostnames belong to this site; keep SvelteKit's origin check enabled for all others.
			trustedOrigins: ['https://ramisbhatty.com', 'https://www.ramisbhatty.com']
		},
		adapter: adapter()
	}
};

export default config;
