import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
	const migrations = await readD1Migrations(path.resolve('migrations'));

	return {
		plugins: [
			// cloudflareTest supplies real Workers bindings; adapter emulation would shadow them.
			sveltekit({
				extensions: ['.svelte', '.md'],
				preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
				csrf: {
					trustedOrigins: ['https://ramisbhatty.com', 'https://www.ramisbhatty.com']
				}
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
