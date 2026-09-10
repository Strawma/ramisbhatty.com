import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const buildTimestamp = new Date().toISOString();

export default defineConfig({
	define: {
		__BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp)
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			extensions: ['.svelte', '.md'],
			preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
			csrf: {
				trustedOrigins: ['https://ramisbhatty.com', 'https://www.ramisbhatty.com']
			},
			adapter: adapter({
				platformProxy: process.env.BOOKCLUB_E2E_PERSIST_DIR
					? {
							// Wrangler adds /v3 to --persist-to; the proxy expects the full path.
							persist: { path: `${process.env.BOOKCLUB_E2E_PERSIST_DIR}/v3` },
							remoteBindings: false
						}
					: undefined
			})
		})
	]
});
