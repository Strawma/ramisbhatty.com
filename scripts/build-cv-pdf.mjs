import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolvePath(root, 'static/documents/ramis-bhatty-cv.pdf');

function findOpenPort() {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const address = probe.address();
			if (!address || typeof address === 'string') {
				probe.close();
				reject(new Error('Unable to allocate a local port for the CV preview'));
				return;
			}
			const port = address.port;
			probe.close(() => resolve(port));
		});
	});
}

const port = await findOpenPort();
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
	'pnpm',
	['exec', 'vite', 'dev', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
	{
		cwd: root,
		detached: process.platform !== 'win32',
		stdio: ['ignore', 'pipe', 'pipe']
	}
);

let serverLog = '';
server.stdout.on('data', (chunk) => {
	serverLog += chunk;
});
server.stderr.on('data', (chunk) => {
	serverLog += chunk;
});

function stopServer() {
	if (!server.pid || server.exitCode !== null) return;
	if (process.platform === 'win32') {
		server.kill('SIGTERM');
		return;
	}
	try {
		process.kill(-server.pid, 'SIGTERM');
	} catch {
		server.kill('SIGTERM');
	}
}

async function waitForServer() {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		if (server.exitCode !== null) {
			throw new Error(`Vite exited before the CV page was ready.\n${serverLog}`);
		}
		try {
			const response = await fetch(`${origin}/cv`);
			if (response.ok) return;
		} catch {
			// The dev server is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Timed out waiting for ${origin}/cv.\n${serverLog}`);
}

let failed = false;
try {
	await waitForServer();
	await mkdir(dirname(output), { recursive: true });

	const browser = await chromium.launch();
	try {
		const page = await browser.newPage();
		await page.addInitScript(() => {
			try {
				localStorage.setItem('theme', 'light');
			} catch {
				// The print styles still force a light CV if storage is unavailable.
			}
		});
		await page.goto(`${origin}/cv`, { waitUntil: 'networkidle' });
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.style.colorScheme = 'light';
		});
		await page.evaluate(() => document.fonts.ready);
		await page.emulateMedia({ media: 'print' });
		await page.pdf({
			path: output,
			format: 'A4',
			printBackground: true,
			preferCSSPageSize: true
		});
	} finally {
		await browser.close();
	}

	console.log(`Wrote ${output}`);
} catch (error) {
	failed = true;
	const message = error instanceof Error ? error.message : String(error);
	console.error(
		message.includes('Executable doesn')
			? `${message}\nRun: pnpm exec playwright install chromium`
			: message
	);
	if (serverLog.trim()) console.error(serverLog.trim());
} finally {
	stopServer();
}

if (failed) process.exitCode = 1;
