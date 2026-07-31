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
	await expect(alice.locator('meta[name="robots"]')).toHaveAttribute(
		'content',
		'noindex, nofollow'
	);

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

test('suggestion slots add, update, and clear reliably on a narrow screen', async ({ browser }) => {
	const { aliceToken } = getTestSessions();
	const memberContext = await createSessionContext(browser, aliceToken);
	const memberPage = await memberContext.newPage();
	await memberPage.setViewportSize({ width: 360, height: 740 });
	await memberPage.goto('/bookclub');

	const startPollButton = memberPage.getByRole('button', { name: 'START POLL' });
	if ((await startPollButton.count()) > 0) {
		await startPollButton.click();
		await expect(memberPage.getByText('A new book poll is open.', { exact: true })).toBeVisible();
	}

	const titleInput = memberPage.getByLabel('Book title for slot 1');
	const authorInput = memberPage.getByLabel('Author for slot 1');
	const slotForm = memberPage.locator('form').filter({ has: titleInput });
	await titleInput.fill('Mobile Test Book');
	await authorInput.fill('Mobile Test Author');
	await slotForm.getByRole('button', { name: 'SAVE', exact: true }).click();
	await expect(titleInput).toHaveValue('Mobile Test Book');
	await expect(authorInput).toHaveValue('Mobile Test Author');
	await expect(slotForm.getByText('FILLED', { exact: true })).toBeVisible();

	await titleInput.fill('Updated Mobile Book');
	await authorInput.fill('Updated Mobile Author');
	await slotForm.getByRole('button', { name: 'UPDATE', exact: true }).click();
	await expect(titleInput).toHaveValue('Updated Mobile Book');
	await expect(authorInput).toHaveValue('Updated Mobile Author');

	await titleInput.fill('');
	await authorInput.fill('');
	await slotForm.getByRole('button', { name: 'CLEAR SLOT', exact: true }).click();
	await expect(titleInput).toHaveValue('');
	await expect(authorInput).toHaveValue('');
	await expect(slotForm.getByText('EMPTY', { exact: true })).toBeVisible();
	await expect(slotForm.getByRole('button', { name: 'SAVE', exact: true })).toBeEnabled();

	const dimensions = await memberPage.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
	await memberContext.close();
});

test('desktop dashboard windows drag, resize, stack, minimize, and persist', async ({
	browser
}) => {
	const { aliceToken } = getTestSessions();
	const memberContext = await createSessionContext(browser, aliceToken);
	const memberPage = await memberContext.newPage();
	await memberPage.setViewportSize({ width: 1280, height: 900 });
	await memberPage.goto('/bookclub');
	await expect(memberPage.locator('.dashboard-workspace')).toHaveAttribute('data-ready', 'true');

	const suggestionHandle = memberPage.getByRole('button', {
		name: 'Move SUGGESTIONS window. Drag, or use the arrow keys.'
	});
	const suggestionWindow = memberPage
		.getByRole('group')
		.filter({ has: memberPage.getByRole('toolbar', { name: 'SUGGESTIONS panel controls' }) });
	const geometry = () =>
		suggestionWindow.evaluate((element) => {
			const style = getComputedStyle(element);
			return {
				left: Number.parseFloat(style.left),
				top: Number.parseFloat(style.top),
				width: Number.parseFloat(style.width),
				height: Number.parseFloat(style.height),
				zIndex: Number.parseInt(style.zIndex, 10)
			};
		});

	const initialGeometry = await geometry();
	await suggestionHandle.scrollIntoViewIfNeeded();
	await suggestionHandle.hover();
	const handleBox = await suggestionHandle.boundingBox();
	if (!handleBox) throw new Error('Suggestion drag handle was not measurable.');
	expect(
		await memberPage.evaluate(
			({ x, y }) => document.elementFromPoint(x, y)?.hasAttribute('data-drag-handle'),
			{ x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 }
		)
	).toBe(true);
	await memberPage.mouse.down();
	await expect(suggestionWindow).toHaveAttribute('data-interaction', 'drag');
	await memberPage.mouse.move(
		handleBox.x + handleBox.width / 2 + 80,
		handleBox.y + handleBox.height / 2 + 60,
		{
			steps: 5
		}
	);
	await expect
		.poll(async () => (await geometry()).left)
		.toBeGreaterThanOrEqual(initialGeometry.left + 70);
	await memberPage.mouse.up();
	const movedGeometry = await geometry();
	expect(movedGeometry.left).toBeGreaterThanOrEqual(initialGeometry.left + 70);
	expect(movedGeometry.top).toBeGreaterThanOrEqual(initialGeometry.top + 50);

	const resizeHandle = memberPage.getByRole('button', {
		name: 'Resize SUGGESTIONS window. Drag, or use the arrow keys.'
	});
	await resizeHandle.scrollIntoViewIfNeeded();
	const resizeBox = await resizeHandle.boundingBox();
	if (!resizeBox) throw new Error('Suggestion resize handle was not measurable.');
	await memberPage.mouse.move(
		resizeBox.x + resizeBox.width / 2,
		resizeBox.y + resizeBox.height / 2
	);
	await memberPage.mouse.down();
	await memberPage.mouse.move(
		resizeBox.x + resizeBox.width / 2 + 70,
		resizeBox.y + resizeBox.height / 2 + 50,
		{
			steps: 5
		}
	);
	await memberPage.mouse.up();
	const resizedGeometry = await geometry();
	expect(resizedGeometry.width).toBeGreaterThanOrEqual(movedGeometry.width + 60);
	expect(resizedGeometry.height).toBeGreaterThanOrEqual(movedGeometry.height + 40);

	const chatHandle = memberPage.getByRole('button', {
		name: 'Move CHATROOM window. Drag, or use the arrow keys.'
	});
	await suggestionHandle.click();
	const focusedSuggestionGeometry = await geometry();
	await chatHandle.click();
	const backgroundSuggestionGeometry = await geometry();
	const chatZIndex = await memberPage
		.getByRole('group')
		.filter({ has: memberPage.getByRole('toolbar', { name: 'CHATROOM panel controls' }) })
		.evaluate((element) => Number.parseInt(getComputedStyle(element).zIndex, 10));
	expect(focusedSuggestionGeometry.zIndex).toBeGreaterThan(initialGeometry.zIndex);
	expect(chatZIndex).toBeGreaterThan(backgroundSuggestionGeometry.zIndex);

	await memberPage.reload();
	await expect.poll(async () => (await geometry()).left).toBe(resizedGeometry.left);
	await expect.poll(async () => (await geometry()).top).toBe(resizedGeometry.top);
	await expect.poll(async () => (await geometry()).width).toBe(resizedGeometry.width);
	await expect.poll(async () => (await geometry()).height).toBe(resizedGeometry.height);

	await memberPage
		.getByRole('toolbar', { name: 'SUGGESTIONS panel controls' })
		.click({ position: { x: 20, y: 18 } });
	await memberPage.getByRole('button', { name: 'Minimize SUGGESTIONS window' }).click();
	await expect(memberPage.getByText('MINIMIZED WINDOWS', { exact: true })).toBeVisible();
	await memberPage.getByRole('button', { name: 'Restore SUGGESTIONS window' }).click();
	await expect(
		memberPage.getByRole('button', {
			name: 'Resize SUGGESTIONS window. Drag, or use the arrow keys.'
		})
	).toBeVisible();

	await memberContext.close();
});

test('ordinary login and logout forms send same-origin CSRF and referrer headers', async ({
	browser
}) => {
	const loginPage = await browser.newPage();
	await loginPage.goto('/bookclub/login');
	await expect(loginPage.locator('meta[name="referrer"]')).toHaveAttribute('content', 'origin');
	const expectedOrigin = new URL(loginPage.url()).origin;

	await loginPage.getByLabel('USERNAME').fill('invalid-user');
	await loginPage.getByLabel('LOGIN CODE').fill('invalid-login-code');
	const loginRequestPromise = loginPage.waitForRequest(
		(request) => request.url().endsWith('/bookclub/login') && request.method() === 'POST'
	);
	await loginPage.getByRole('button', { name: 'ENTER THE CLUB' }).click();
	const loginHeaders = (await loginRequestPromise).headers();
	expect(loginHeaders.origin).toBe(expectedOrigin);
	expect(loginHeaders.referer).toBe(`${expectedOrigin}/`);
	await loginPage.close();

	const { aliceToken } = getTestSessions();
	const memberContext = await createSessionContext(browser, aliceToken);
	const memberPage = await memberContext.newPage();
	await memberPage.goto('/bookclub');

	const logoutRequestPromise = memberPage.waitForRequest(
		(request) => request.url().endsWith('/bookclub/logout') && request.method() === 'POST'
	);
	await memberPage.getByRole('button', { name: 'LOG OUT' }).click();
	const logoutHeaders = (await logoutRequestPromise).headers();
	expect(logoutHeaders.origin).toBe(expectedOrigin);
	expect(logoutHeaders.referer).toBe(`${expectedOrigin}/`);
	await expect(memberPage).toHaveURL('/bookclub/login');
	await memberContext.close();
});
