import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
	const migrations = await readD1Migrations(path.resolve('migrations'));

	return {
		plugins: [
			sveltekit({
				extensions: ['.svelte', '.md'],
				preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
				csrf: {
					trustedOrigins: ['https://ramisbhatty.com', 'https://www.ramisbhatty.com']
				},
				adapter: adapter()
			}),
			cloudflareTest({
				wrangler: { configPath: './wrangler.jsonc' },
				miniflare: {
					bindings: { TEST_MIGRATIONS: migrations }
				}
			})
		],
		test: {
			include: ['tests/**/*.test.ts'],
			setupFiles: ['./tests/apply-migrations.ts']
		}
	};
});
