import { expect, test, type Browser } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface TestSessions {
	aliceToken: string;
	bobToken: string;
}

function getTestSessions(): TestSessions {
	const sessionFile = process.env.BOOKCLUB_E2E_SESSION_FILE;
	if (!sessionFile) throw new Error('The browser-test session file was not configured.');

	return JSON.parse(readFileSync(sessionFile, 'utf8')) as TestSessions;
}

async function createSessionContext(browser: Browser, token: string) {
	const context = await browser.newContext();
	await context.addCookies([
		{
			name: 'bookclub_session',
			value: token,
			domain: '127.0.0.1',
			path: '/bookclub'
		}
	]);
	return context;
}

test('chat sends between sessions and remains responsive', async ({ browser }) => {
	const { aliceToken, bobToken } = getTestSessions();
	const contextAlice = await createSessionContext(browser, aliceToken);
	const contextBob = await createSessionContext(browser, bobToken);
	const alice = await contextAlice.newPage();
	const bob = await contextBob.newPage();
	const consoleErrors: string[] = [];

	alice.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
	});
	alice.on('pageerror', (error) => consoleErrors.push(error.message));

	await Promise.all([
		alice.goto('/bookclub', { waitUntil: 'domcontentloaded' }),
		bob.goto('/bookclub', { waitUntil: 'domcontentloaded' })
	]);
	await expect(alice.locator('#chatroom')).toBeVisible();
	await expect(bob.locator('#chatroom')).toBeVisible();

	const message = `Browser chat check ${Date.now()}`;
	await alice.getByPlaceholder('type a message...').fill(message);
	await alice.getByRole('button', { name: 'SEND' }).click();

	await expect(alice.getByText(message, { exact: true })).toBeVisible({ timeout: 8_000 });
	await expect(bob.getByText(message, { exact: true })).toBeVisible({ timeout: 8_000 });
	await expect(alice.getByRole('button', { name: 'SEND' })).toBeEnabled();
	await expect(alice.getByPlaceholder('type a message...')).toBeVisible();
	await expect(alice.getByText('Chat refresh is currently unavailable.')).toHaveCount(0);

	if (consoleErrors.length > 0) {
		throw new Error(`Browser console errors before fault injection:\n${consoleErrors.join('\n')}`);
	}

	const messageRow = alice.getByText(message, { exact: true }).locator('..');
	await messageRow.getByRole('button', { name: 'Delete your message' }).click();
	await expect(alice.getByText('[DELETED BY MEMBER]', { exact: true })).toBeVisible();
	await expect(bob.getByText('[DELETED BY MEMBER]', { exact: true })).toBeVisible({
		timeout: 8_000
	});

	let activePolls = 0;
	let maximumActivePolls = 0;
	let pollRequests = 0;
	await alice.route('**/bookclub/chat', async (route) => {
		activePolls += 1;
		maximumActivePolls = Math.max(maximumActivePolls, activePolls);
		pollRequests += 1;
		const response = await route.fetch();
		if (pollRequests === 1) await new Promise((resolve) => setTimeout(resolve, 5_500));
		await route.fulfill({ response });
		activePolls -= 1;
	});
	await alice.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect.poll(() => pollRequests).toBeGreaterThan(0);
	await alice.waitForTimeout(7_000);
	await expect.poll(() => maximumActivePolls).toBe(1);
	await alice.unroute('**/bookclub/chat');

	await alice.route('**/bookclub/chat', (route) => route.abort());
	await alice.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(
		alice.getByText('Chat refresh is currently unavailable.', { exact: false })
	).toBeVisible({ timeout: 3_000 });
	await alice.unroute('**/bookclub/chat');
	await alice.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(
		alice.getByText('Chat refresh is currently unavailable.', { exact: false })
	).toHaveCount(0, { timeout: 3_000 });

	await contextAlice.close();
	await contextBob.close();
});
