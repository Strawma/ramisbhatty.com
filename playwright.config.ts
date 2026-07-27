import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	testMatch: 'public-site.spec.ts',
	timeout: 30_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	reporter: 'line',
	use: {
		baseURL: 'http://127.0.0.1:5173',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: 'pnpm dev -- --host 127.0.0.1 --port 5173',
		url: 'http://127.0.0.1:5173/',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
