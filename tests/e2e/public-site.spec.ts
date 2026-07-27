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
	{ path: '/interests', heading: 'Interests', title: /^Interests \| Ramis Bhatty$/ },
	{ path: '/cv', heading: 'CV', title: /^CV \| Ramis Bhatty$/ }
];

const draftRoutes: RouteExpectation[] = [
	{
		path: '/education/comp1201',
		heading: 'COMP1201: TODO: Module title',
		title: /^COMP1201: TODO: Module title \| Ramis Bhatty$/
	},
	{
		path: '/work/module-project-placeholder',
		heading: 'TODO: Project title',
		title: /^TODO: Project title \| Ramis Bhatty$/
	},
	{
		path: '/work/experience/research-internship',
		heading: 'Research intern',
		title: /^Research intern, TODO: Organisation \| Ramis Bhatty$/
	},
	{
		path: '/blog/first-post',
		heading: 'TODO: First post title',
		title: /^TODO: First post title \| Ramis Bhatty$/
	},
	{
		path: '/interests/games',
		heading: 'Games',
		title: /^Games \| Interests \| Ramis Bhatty$/
	}
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

test('authored draft records are reachable locally and visibly labelled', async ({ page }) => {
	for (const route of draftRoutes) {
		const response = await page.goto(route.path);
		expect(response?.ok(), route.path).toBe(true);
		await expect(page).toHaveTitle(route.title);
		await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
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
	await expect(page.locator(':focus')).toBeVisible();
});

test('the silly route remains separate, titled, and usable on mobile', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 360, height: 740 });
	const runtimeErrors = collectRuntimeErrors(page);
	const response = await page.goto('/silly', { waitUntil: 'domcontentloaded' });

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Silly \| Ramis Bhatty$/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const dimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
	expect(runtimeErrors).toEqual([]);
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
