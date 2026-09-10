import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Share a fresh database between Wrangler setup and the test server, never the local preview.
process.env.BOOKCLUB_E2E_PERSIST_DIR ??= mkdtempSync(join(tmpdir(), 'bookclub-e2e-'));

export default defineConfig({
	testDir: './tests/e2e',
	testMatch: 'bookclub-*.spec.ts',
	globalSetup: './tests/e2e/global-setup.ts',
	timeout: 30_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	reporter: 'line',
	use: {
		baseURL: 'http://127.0.0.1:5174',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: 'pnpm exec vite dev --host 127.0.0.1 --port 5174 --strictPort',
		url: 'http://127.0.0.1:5174/bookclub/login',
		reuseExistingServer: false,
		timeout: 120_000
	}
});
