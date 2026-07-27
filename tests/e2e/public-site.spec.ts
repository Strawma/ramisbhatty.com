import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface RouteExpectation {
	path: string;
	heading: string;
	title: RegExp;
}

const mainRoutes: RouteExpectation[] = [
	{ path: '/', heading: 'Ramis Bhatty', title: /^Ramis Bhatty$/ },
	{ path: '/about', heading: 'About', title: /^About \| Ramis Bhatty$/ },
	{ path: '/work', heading: 'Work', title: /^Work \| Ramis Bhatty$/ },
	{ path: '/education', heading: 'Education', title: /^Education \| Ramis Bhatty$/ },
	{ path: '/blog', heading: 'Writing', title: /^Writing \| Ramis Bhatty$/ },
	{ path: '/interests', heading: 'Interests', title: /^Interests \| Ramis Bhatty$/ }
];

const draftRoutes = [
	'/education/comp1201',
	'/work/module-project-placeholder',
	'/work/experience/research-internship',
	'/blog/first-post',
	'/interests/games'
];

function collectRuntimeErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));
	return errors;
}

for (const route of mainRoutes) {
	test(`${route.path} has metadata, a heading, and no serious accessibility violations`, async ({
		page
	}) => {
		const runtimeErrors = collectRuntimeErrors(page);
		const response = await page.goto(route.path, { waitUntil: 'networkidle' });

		expect(response?.ok()).toBe(true);
		await expect(page).toHaveTitle(route.title);
		await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
		await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);

		const accessibility = await new AxeBuilder({ page }).analyze();
		expect(accessibility.violations).toEqual([]);
		expect(runtimeErrors).toEqual([]);
	});
}

test('primary navigation keeps personal and silly destinations secondary', async ({ page }) => {
	await page.goto('/');

	const navigation = page.getByRole('navigation', { name: 'Main navigation' });
	await expect(navigation.getByRole('link', { name: 'Writing' })).toHaveAttribute('href', '/blog');
	await expect(navigation.getByRole('link', { name: 'CV' })).toHaveAttribute('href', '/cv');
	await expect(navigation.getByRole('link', { name: 'Interests' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: /silly/i })).toHaveCount(0);

	const footer = page.getByRole('contentinfo');
	await expect(footer.getByRole('link', { name: 'Interests' })).toHaveAttribute(
		'href',
		'/interests'
	);
	await expect(
		footer.getByRole('link', { name: 'Visit the silly version of this site' })
	).toHaveAttribute('href', '/silly');
});

test('education groups modules chronologically with averages, awards, and the latest year open', async ({
	page
}) => {
	await page.goto('/education');

	const yearGroups = page.locator('details');
	await expect(yearGroups).toHaveCount(3);

	const firstYear = yearGroups.filter({ hasText: 'First Year, 2023/24' });
	const secondYear = yearGroups.filter({ hasText: 'Second Year, 2024/25' });
	const thirdYear = yearGroups.filter({ hasText: 'Third Year, 2025/26' });

	await expect(firstYear).not.toHaveAttribute('open');
	await expect(secondYear).not.toHaveAttribute('open');
	await expect(thirdYear).toHaveAttribute('open', '');
	await expect(firstYear.getByLabel('Year average: 84.4%')).toBeVisible();
	await expect(secondYear.getByLabel('Year average: 79.6%')).toBeVisible();
	await expect(thirdYear.getByLabel('Year average: 81.3%')).toBeVisible();
	await expect(firstYear.getByText(/Netcraft Prize/)).toBeVisible();
	await expect(secondYear.getByText(/Netcraft Prize/)).toBeVisible();

	await firstYear.locator('summary').click();
	const comp1201 = page
		.locator('article')
		.filter({ has: page.locator('a[href="/education/comp1201"]') });
	await expect(comp1201.getByLabel('Overall mark: 76%')).toBeVisible();
});

test('authored draft records are reachable locally and visibly labelled', async ({ page }) => {
	for (const path of draftRoutes) {
		const response = await page.goto(path);
		expect(response?.ok(), path).toBe(true);
		await expect(page).toHaveTitle(/\| (Interests \| )?Ramis Bhatty$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByText('LOCAL DRAFT', { exact: true }).first()).toBeVisible();
	}
});

test('main routes fit a narrow mobile viewport and retain keyboard navigation', async ({
	page
}) => {
	await page.setViewportSize({ width: 360, height: 740 });

	for (const route of mainRoutes) {
		await page.goto(route.path);
		const dimensions = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(dimensions.scrollWidth, route.path).toBeLessThanOrEqual(dimensions.clientWidth);
	}

	await page.goto('/');
	await page.keyboard.press('Tab');
	const skipLink = page.getByRole('link', { name: 'Skip to main content' });
	await expect(skipLink).toBeFocused();
	await expect(skipLink).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.locator('#main-content')).toBeFocused();
});

test('the silly route remains separate, titled, and usable on mobile', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 360, height: 740 });
	const runtimeErrors = collectRuntimeErrors(page);
	const response = await page.goto('/silly', { waitUntil: 'domcontentloaded' });

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Silly \| Ramis Bhatty$/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.locator('canvas')).toHaveAttribute('aria-hidden', 'true');

	const dimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
	const accessibility = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
	expect(accessibility.violations).toEqual([]);
	expect(runtimeErrors).toEqual([]);
});

test('the streaming scene respects utility indexing and reduced-motion preferences', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const response = await page.goto('/streaming/brb');

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Be Right Back \| Ramis Bhatty$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Be Right Back!' })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

	const accessibility = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
	expect(accessibility.violations).toEqual([]);
});

test('unfinished public indexes stay out of search results', async ({ page }) => {
	for (const path of ['/blog', '/interests']) {
		await page.goto(path);
		await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute(
			'content',
			'noindex, follow'
		);
	}
});

test('/cv redirects directly to the technical CV PDF', async ({ request }) => {
	const response = await request.get('/cv', { maxRedirects: 0 });

	expect(response.status()).toBe(307);
	expect(response.headers().location).toBe('/documents/ramis-bhatty-cv.pdf');

	const pdf = await request.get('/documents/ramis-bhatty-cv.pdf');
	expect(pdf.ok()).toBe(true);
	expect(pdf.headers()['content-type']).toContain('application/pdf');
});

test('unknown authored records return not found', async ({ request }) => {
	for (const path of [
		'/work/not-a-project',
		'/education/not-a-module',
		'/blog/not-a-post',
		'/interests/not-an-interest'
	]) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(404);
	}
});
