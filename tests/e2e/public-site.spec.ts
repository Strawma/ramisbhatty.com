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
	{
		path: '/work/cell-migration-segmentation',
		heading: 'Comparing segmentation methods for cell migration',
		title: /^Comparing segmentation methods for cell migration \| Ramis Bhatty$/
	},
	{
		path: '/work/go2-lidar-perception',
		heading: 'LiDAR perception for assistive robot dogs',
		title: /^LiDAR perception for assistive robot dogs \| Ramis Bhatty$/
	},
	{
		path: '/work/go2-lidar-perception/poster',
		heading: 'Can LiDAR help a robot dog spot what moves?',
		title: /^Can LiDAR help a robot dog spot what moves\? \| Ramis Bhatty$/
	},
	{ path: '/education', heading: 'Education', title: /^Education \| Ramis Bhatty$/ },
	{ path: '/blog', heading: 'Writing', title: /^Writing \| Ramis Bhatty$/ },
	{ path: '/interests', heading: 'Interests', title: /^Interests \| Ramis Bhatty$/ }
];

const draftRoutes = ['/work/module-project-placeholder', '/blog/first-post', '/interests/games'];

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
		await expect(page.locator('link[rel="icon"]')).toHaveCount(0);

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

test('primary navigation marks the current route and nested sections active', async ({ page }) => {
	const navigation = page.getByRole('navigation', { name: 'Main navigation' });

	await page.goto('/');
	await expect(navigation.getByRole('link', { name: 'Home' })).toHaveClass(/font-semibold/);

	await page.goto('/work/module-project-placeholder');
	await expect(navigation.getByRole('link', { name: 'Work' })).toHaveClass(/font-semibold/);
	await expect(navigation.getByRole('link', { name: 'Home' })).not.toHaveClass(/font-semibold/);
});

test('education groups modules chronologically with averages, awards, and the latest year open', async ({
	page
}) => {
	// Let hydration finish before testing a native toggle that startup can otherwise reset.
	await page.goto('/education', { waitUntil: 'networkidle' });

	const university = page.getByRole('region', { name: 'University', exact: true });
	const yearGroups = university.locator(':scope > details').locator('details');
	await expect(yearGroups).toHaveCount(4);

	const firstYear = yearGroups.filter({ hasText: 'First Year, 2023/24' });
	const secondYear = yearGroups.filter({ hasText: 'Second Year, 2024/25' });
	const thirdYear = yearGroups.filter({ hasText: 'Third Year, 2025/26' });
	const fourthYear = yearGroups.filter({ hasText: 'Fourth Year, 2026/27' });

	await expect(firstYear).not.toHaveAttribute('open');
	await expect(secondYear).not.toHaveAttribute('open');
	await expect(thirdYear).not.toHaveAttribute('open');
	await expect(fourthYear).toHaveAttribute('open', '');
	await expect(fourthYear.getByText('Ongoing', { exact: true })).toBeVisible();
	await expect(fourthYear.getByLabel(/Year average/)).toHaveCount(0);
	await expect(fourthYear.getByRole('link')).toHaveCount(0);
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
	await expect(comp1201.getByRole('heading', { level: 5 })).toContainText('COMP1201');
});

test('school results start collapsed and expose all qualifications with the keyboard', async ({
	page
}) => {
	await page.goto('/education', { waitUntil: 'networkidle' });
	const school = page.getByRole('region', { name: 'Secondary education', exact: true });
	const university = page.getByRole('region', { name: 'University', exact: true });
	const schoolDisclosure = school.locator(':scope > details');
	const universityDisclosure = university.locator(':scope > details');
	await expect(schoolDisclosure).not.toHaveAttribute('open');
	await expect(universityDisclosure).toHaveAttribute('open', '');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText([
		'Secondary education',
		'University'
	]);
	await expect(school.getByText(/I studied at Bournemouth School/)).not.toBeVisible();
	await expect(university.getByText(/I study Computer Science/)).toBeVisible();
	await schoolDisclosure.locator(':scope > summary').focus();
	await page.keyboard.press('Enter');
	await expect(schoolDisclosure).toHaveAttribute('open', '');
	await expect(school.getByText(/I studied at Bournemouth School/)).toBeVisible();
	await expect(universityDisclosure).toHaveAttribute('open', '');
	await universityDisclosure.locator(':scope > summary').focus();
	await page.keyboard.press('Enter');
	await expect(universityDisclosure).not.toHaveAttribute('open');
	await expect(university.getByText(/I study Computer Science/)).not.toBeVisible();
	await expect(schoolDisclosure).toHaveAttribute('open', '');
	await page.keyboard.press('Enter');
	await expect(universityDisclosure).toHaveAttribute('open', '');
	const aLevels = schoolDisclosure.locator('details').filter({ hasText: 'A levels' });
	const gcses = schoolDisclosure.locator('details').filter({ hasText: 'GCSEs' });
	await expect(aLevels).not.toHaveAttribute('open');
	await expect(gcses).not.toHaveAttribute('open');
	await expect(school.getByRole('table')).toHaveCount(0);
	await aLevels.locator('summary').focus();
	await page.keyboard.press('Enter');
	await expect(aLevels).toHaveAttribute('open', '');
	await expect(gcses).not.toHaveAttribute('open');
	await gcses.locator('summary').focus();
	await page.keyboard.press('Enter');
	await expect(gcses).toHaveAttribute('open', '');
	const tables = school.getByRole('table');
	await expect(tables).toHaveCount(2);
	await expect(tables.nth(0).getByRole('row')).toHaveCount(5);
	await expect(tables.nth(0).getByRole('row', { name: 'Maths A*', exact: true })).toBeVisible();
	await expect(
		tables.nth(0).getByRole('row', { name: 'Computer Science A*', exact: true })
	).toBeVisible();
	await expect(
		tables.nth(0).getByRole('row', { name: 'Further Maths A', exact: true })
	).toBeVisible();
	await expect(tables.nth(0).getByRole('row', { name: 'Physics A', exact: true })).toBeVisible();
	await expect(tables.nth(1).getByRole('row')).toHaveCount(12);
	await expect(tables.nth(1).getByRole('cell', { name: '9', exact: true })).toHaveCount(10);
	await expect(
		tables.nth(1).getByRole('row', { name: 'Religious Studies 8', exact: true })
	).toBeVisible();
	await page.setViewportSize({ width: 360, height: 740 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
	const accessibility = await new AxeBuilder({ page }).analyze();
	expect(accessibility.violations).toEqual([]);
});

test('published module and experience records are available without draft labels', async ({
	page
}) => {
	for (const path of ['/education/comp1201', '/work/experience/research-internship']) {
		const response = await page.goto(path);
		expect(response?.ok(), path).toBe(true);
		await expect(page.getByText('LOCAL DRAFT', { exact: true })).toHaveCount(0);
	}
});

test('authored draft records are reachable locally and visibly labelled', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 740 });

	for (const path of draftRoutes) {
		const response = await page.goto(path);
		expect(response?.ok(), path).toBe(true);
		await expect(page).toHaveTitle(/\| (Interests \| )?Ramis Bhatty$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByText('LOCAL DRAFT', { exact: true }).first()).toBeVisible();
		const dimensions = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(dimensions.scrollWidth, path).toBeLessThanOrEqual(dimensions.clientWidth);
	}
});

test('selected work connects both projects and the cell study to its module and results figure', async ({
	page,
	request
}) => {
	await page.goto('/');
	const selectedWork = page.locator('section').filter({
		has: page.getByRole('heading', { name: 'Selected work', exact: true })
	});
	await expect(selectedWork.locator('a[href="/work/go2-lidar-perception"]')).toBeVisible();
	await selectedWork.locator('a[href="/work/cell-migration-segmentation"]').click();
	await expect(page.getByText('LOCAL DRAFT', { exact: true })).toHaveCount(0);
	await expect(page.locator('article header a[href="/education/comp3200"]')).toBeVisible();
	const figure = page.getByRole('img', { name: /Paired bars show higher mean Dice/ });
	await figure.scrollIntoViewIfNeeded();
	await expect(figure).toBeVisible();
	await expect
		.poll(() => figure.evaluate((element) => (element as HTMLImageElement).naturalWidth))
		.toBeGreaterThan(0);
	await expect(page.getByRole('cell', { name: '0.876', exact: true })).toBeVisible();
	await expect(
		page.getByRole('link', { name: 'Cell Migration Framework on GitHub' })
	).toHaveAttribute('href', 'https://github.com/Strawma/cell-migration-framework');

	const chart = await request.get('/images/projects/cell-migration/dice-by-clip.svg');
	expect(chart.ok()).toBe(true);
	expect(chart.headers()['content-type']).toContain('image/svg+xml');

	await page.goto('/education/comp3200');
	await expect(
		page.getByRole('link', {
			name: 'Comparing segmentation methods for cell migration',
			exact: true
		})
	).toBeVisible();
});

test('the internship and case study link to the poster PDF and its text equivalent', async ({
	page,
	request
}) => {
	for (const path of ['/work/experience/research-internship', '/work/go2-lidar-perception']) {
		await page.goto(path);
		await expect(page.locator('a[href="/documents/go2-lidar-poster.pdf"]')).toBeVisible();
		await expect(page.locator('a[href="/work/go2-lidar-perception/poster"]')).toBeVisible();
	}

	const pdf = await request.get('/documents/go2-lidar-poster.pdf');
	expect(pdf.ok()).toBe(true);
	expect(pdf.headers()['content-type']).toContain('application/pdf');
	expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
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
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/silly/favicon.ico');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.locator('a[href="/silly/who-is-ramis-bhatty"]')).toBeVisible();
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

test('the silly route loads its bundled pixel font', async ({ page }) => {
	const fontResponse = page.waitForResponse(
		(response) => response.url().endsWith('.ttf') && response.ok()
	);

	await page.goto('/silly');
	await fontResponse;
});

test('the dubious biography is public, crawlable, and usable on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 740 });
	const runtimeErrors = collectRuntimeErrors(page);
	const response = await page.goto('/silly/who-is-ramis-bhatty', {
		waitUntil: 'domcontentloaded'
	});

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Who Is Ramis Bhatty\? \| A Comprehensive Biography$/);
	await expect(page.locator('meta[name="description"]')).toHaveAttribute(
		'content',
		/experienced pirate captain.*2,000 years old.*madly in love with you/
	);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://ramisbhatty.com/silly/who-is-ramis-bhatty'
	);
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 1, name: 'Who Is Ramis Bhatty?' })).toBeVisible();
	await expect(page.getByText('Approximately 2,000 years, subject to carbon dating')).toBeVisible();
	await expect(page.getByText(/convenience of crawlers/i)).toHaveCount(0);
	await expect(page.getByRole('link', { name: '← Silly homepage' })).toHaveAttribute(
		'href',
		'/silly'
	);

	const dimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

	const accessibility = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
	expect(accessibility.violations).toEqual([]);
	expect(runtimeErrors).toEqual([]);
});

test('crawler discovery files advertise only indexable public routes', async ({ request }) => {
	const robots = await request.get('/robots.txt');
	expect(robots.ok()).toBe(true);
	expect(robots.headers()['content-type']).toContain('text/plain');
	expect(await robots.text()).toBe(
		'User-agent: *\nAllow: /\n\nSitemap: https://ramisbhatty.com/sitemap.xml\n'
	);

	const sitemap = await request.get('/sitemap.xml');
	expect(sitemap.ok()).toBe(true);
	expect(sitemap.headers()['content-type']).toContain('application/xml');
	const sitemapBody = await sitemap.text();
	expect(sitemapBody).toContain('<loc>https://ramisbhatty.com/silly/who-is-ramis-bhatty</loc>');
	expect(sitemapBody).toContain('<loc>https://ramisbhatty.com/education/comp1201</loc>');
	expect(sitemapBody).toContain(
		'<loc>https://ramisbhatty.com/work/experience/research-internship</loc>'
	);
	expect(sitemapBody).toContain(
		'<loc>https://ramisbhatty.com/work/go2-lidar-perception/poster</loc>'
	);
	expect(sitemapBody).not.toContain('<loc>https://ramisbhatty.com/blog</loc>');
	expect(sitemapBody).not.toContain('module-project-placeholder');
	expect(sitemapBody).toContain(
		'<loc>https://ramisbhatty.com/work/cell-migration-segmentation</loc>'
	);
	expect(sitemapBody).not.toContain('/bookclub');
	expect(sitemapBody).not.toContain('/streaming');
});

test('the retro favicon asset is available only beneath the silly route', async ({ request }) => {
	const rootIcon = await request.get('/favicon.ico');
	const sillyIcon = await request.get('/silly/favicon.ico');

	expect(rootIcon.status()).toBe(404);
	expect(sillyIcon.ok()).toBe(true);
	expect(sillyIcon.headers()['content-type']).toContain('image/');
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
