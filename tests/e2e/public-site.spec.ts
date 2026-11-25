import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface RouteExpectation {
	path: string;
	heading: string;
	title: RegExp;
}

const mainRoutes: RouteExpectation[] = [
	{ path: '/', heading: 'Ramis Bhatty', title: /^Ramis Bhatty$/ },
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
	{ path: '/cv', heading: 'Ramis Bhatty', title: /^Curriculum Vitae \| Ramis Bhatty$/ }
];

const draftRoutes = ['/work/module-project-placeholder'];

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

test('primary navigation advertises only current destinations', async ({ page }) => {
	await page.goto('/');

	const navigation = page.getByRole('navigation', { name: 'Main navigation' });
	await expect(navigation.getByRole('link', { name: 'CV' })).toHaveAttribute('href', '/cv');
	await expect(navigation.getByRole('link', { name: 'Work' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: 'Education' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: 'About' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: 'Writing' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: 'Blog' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: 'Interests' })).toHaveCount(0);
	await expect(navigation.getByRole('link', { name: /silly/i })).toHaveCount(0);

	const footer = page.getByRole('contentinfo');
	await expect(footer.getByRole('link', { name: 'Interests' })).toHaveCount(0);
	await expect(
		footer.getByRole('link', { name: 'Visit the silly version of this site' })
	).toHaveAttribute('href', '/silly');
});

test('theme follows the system preference, toggles, and persists', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/', { waitUntil: 'networkidle' });

	const html = page.locator('html');
	const toggle = page.getByRole('switch', { name: 'Dark mode' });

	await expect(html).not.toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'false');

	await page.emulateMedia({ colorScheme: 'dark' });
	await expect(html).toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'true');
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

	await page.emulateMedia({ colorScheme: 'light' });
	await expect(html).not.toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'false');

	await toggle.click();
	await expect(html).toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'true');
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
	expect(await page.evaluate(() => document.cookie)).toContain('theme=dark');

	await page.emulateMedia({ colorScheme: 'light' });
	await page.reload();
	await expect(html).toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'true');

	await toggle.click();
	await expect(html).not.toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'false');
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
	expect(await page.evaluate(() => document.cookie)).toContain('theme=light');

	await page.emulateMedia({ colorScheme: 'dark' });
	await page.reload();
	await expect(html).not.toHaveClass(/dark/);
	await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('SSR renders persisted dark theme before scripts run and keeps fixed-palette routes light', async ({
	browser,
	request,
	baseURL
}) => {
	const darkHomeResponse = await request.get('/', { headers: { cookie: 'theme=dark' } });
	expect(darkHomeResponse.ok()).toBe(true);
	const darkHomeHtml = await darkHomeResponse.text();
	expect(darkHomeHtml).toContain(
		'<html lang="en" class="dark" style="color-scheme: dark; background-color: #0a0a0a;">'
	);
	expect(darkHomeHtml).toContain('<meta name="color-scheme" content="dark" />');
	expect(darkHomeHtml.match(/<meta name="color-scheme"/g) ?? []).toHaveLength(1);

	const sillyResponse = await request.get('/silly', { headers: { cookie: 'theme=dark' } });
	expect(sillyResponse.ok()).toBe(true);
	const sillyHtml = await sillyResponse.text();
	expect(sillyHtml).toContain('<html lang="en">');
	expect(sillyHtml).not.toContain('class="dark"');
	expect(sillyHtml).not.toContain('background-color:#0a0a0a');
	expect(sillyHtml).toContain('<meta name="color-scheme" content="light" />');
	expect(sillyHtml.match(/<meta name="color-scheme"/g) ?? []).toHaveLength(1);

	const noJsContext = await browser.newContext({
		javaScriptEnabled: false,
		colorScheme: 'light'
	});
	try {
		await noJsContext.addCookies([{ name: 'theme', value: 'dark', url: baseURL! }]);
		const noJsPage = await noJsContext.newPage();

		await noJsPage.goto('/');
		await expect(noJsPage.locator('html')).toHaveClass(/dark/);
		await expect(noJsPage.locator('html')).toHaveCSS('background-color', 'rgb(10, 10, 10)');
		await expect(noJsPage.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');

		await noJsPage.goto('/silly');
		await expect(noJsPage.locator('html')).not.toHaveClass(/dark/);
		await expect(
			noJsPage.getByRole('heading', { level: 1, name: 'WELCOME TO MY WEBSITE!!!' })
		).toHaveCSS('color', 'rgb(0, 0, 0)');
	} finally {
		await noJsContext.close();
	}

	const backfillContext = await browser.newContext({ colorScheme: 'light' });
	try {
		const backfillPage = await backfillContext.newPage();
		await backfillPage.addInitScript(() => {
			localStorage.setItem('theme', 'dark');
		});
		await backfillPage.goto('/', { waitUntil: 'networkidle' });
		expect(await backfillPage.evaluate(() => document.cookie)).toContain('theme=dark');
	} finally {
		await backfillContext.close();
	}
});

test('dark mode prints with light ink on a white background', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });

	for (const path of ['/cv', '/work/go2-lidar-perception']) {
		await page.goto(path, { waitUntil: 'networkidle' });
		await page.emulateMedia({ media: 'print', colorScheme: 'dark' });

		const colors = await page.evaluate(() => {
			const toRgb = (cssColor: string) => {
				const canvas = document.createElement('canvas');
				canvas.width = 1;
				canvas.height = 1;
				const context = canvas.getContext('2d');
				if (!context) throw new Error('2d context unavailable');
				context.fillStyle = '#ffffff';
				context.fillRect(0, 0, 1, 1);
				context.fillStyle = cssColor;
				context.fillRect(0, 0, 1, 1);
				return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
			};

			const wrapper = document.querySelector('body > div > div');
			const heading = document.querySelector('main h1');
			const paragraph = document.querySelector('main article > div p, main section p');
			if (!wrapper || !heading || !paragraph) throw new Error('Expected main layout elements');

			return {
				background: toRgb(getComputedStyle(wrapper).backgroundColor),
				heading: toRgb(getComputedStyle(heading).color),
				paragraph: toRgb(getComputedStyle(paragraph).color)
			};
		});

		expect(
			colors.background.every((channel) => channel >= 240),
			path
		).toBe(true);
		expect(
			colors.heading.every((channel) => channel <= 80),
			path
		).toBe(true);
		expect(
			colors.paragraph.every((channel) => channel <= 80),
			path
		).toBe(true);
	}
});

test('dark mode does not leak onto fixed-palette routes and restores on return', async ({
	page
}) => {
	await page.route('https://uselessfacts.jsph.pl/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ text: 'A deterministic fact for testing.' })
		})
	);

	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/', { waitUntil: 'networkidle' });

	const html = page.locator('html');
	const toggle = page.getByRole('switch', { name: 'Dark mode' });
	await expect(html).toHaveClass(/dark/);
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
		.toBe('dark');

	// Persist explicit dark mode before leaving the main site.
	await page.evaluate(() => localStorage.setItem('theme', 'dark'));

	await page.getByRole('link', { name: 'Visit the silly version of this site' }).click();
	await page.waitForURL('**/silly');

	await expect(html).not.toHaveClass(/dark/);
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
		.toBe('light');

	for (const locator of [
		page.getByRole('heading', { level: 1, name: 'WELCOME TO MY WEBSITE!!!' }),
		page.locator('main p').filter({ hasText: 'Netscape Navigator' }),
		page.getByRole('heading', { level: 2, name: ': : MENU : :' }),
		page.getByRole('heading', { level: 2, name: '< RANDOM FACT GENERATOR >' }),
		page.getByText('!!! SITE UNDER CONSTRUCTION !!!')
	]) {
		await expect(locator).toHaveCSS('color', 'rgb(0, 0, 0)');
	}

	await page.getByRole('link', { name: '> About Me' }).click();
	await page.waitForURL('**/silly/who-is-ramis-bhatty');
	await expect(html).not.toHaveClass(/dark/);
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
		.toBe('light');

	await page.getByRole('link', { name: 'Suspiciously normal website' }).click();
	await page.waitForURL(`${new URL(page.url()).origin}/`);
	await expect(html).toHaveClass(/dark/);
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
		.toBe('dark');
	await expect(toggle).toHaveAttribute('aria-checked', 'true');

	for (const path of [
		'/silly',
		'/silly/who-is-ramis-bhatty',
		'/silly/legacy',
		'/bookclub/login',
		'/streaming/brb'
	]) {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		await expect(html, path).not.toHaveClass(/dark/);
		await expect
			.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), {
				message: path
			})
			.toBe('light');
		if (path === '/silly') {
			await expect(
				page.getByRole('heading', { level: 1, name: 'WELCOME TO MY WEBSITE!!!' })
			).toHaveCSS('color', 'rgb(0, 0, 0)');
		}
	}
});

test('dark mode has no serious accessibility violations', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });

	for (const path of [
		'/',
		'/cv',
		'/education',
		'/education/comp1201',
		'/work/go2-lidar-perception',
		'/work/go2-lidar-perception/poster',
		'/work/cell-migration-segmentation',
		'/work/experience/research-internship'
	]) {
		await page.goto(path, { waitUntil: 'networkidle' });
		if (path === '/education') {
			await page.evaluate(() => {
				for (const details of document.querySelectorAll('details')) {
					details.open = true;
				}
			});
		}
		const accessibility = await new AxeBuilder({ page }).analyze();
		expect(accessibility.violations, path).toEqual([]);
	}
});

test('primary navigation marks the current route active', async ({ page }) => {
	const navigation = page.getByRole('navigation', { name: 'Main navigation' });

	await page.goto('/');
	await expect(navigation.getByRole('link', { name: 'Home' })).toHaveClass(/font-semibold/);

	await page.goto('/cv');
	await expect(navigation.getByRole('link', { name: 'CV' })).toHaveClass(/font-semibold/);
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
		await expect(page).toHaveTitle(/\| Ramis Bhatty$/);
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
		has: page.getByRole('heading', { name: 'Selected projects', exact: true })
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
		await expect(
			page.locator('article > div a[href="/work/go2-lidar-perception/poster"]')
		).toBeVisible();
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
	await page.route('https://uselessfacts.jsph.pl/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ text: 'A deterministic fact for testing.' })
		})
	);

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

test('the silly analogue-horror dark mode persists separately, works under reduced motion, and stays isolated from the main site', async ({
	page
}) => {
	await page.route('https://uselessfacts.jsph.pl/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ text: 'A deterministic fact for testing.' })
		})
	);

	await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
	await page.setViewportSize({ width: 360, height: 740 });
	const runtimeErrors = collectRuntimeErrors(page);

	await page.goto('/silly', { waitUntil: 'networkidle' });
	const main = page.locator('main');
	const html = page.locator('html');

	await expect(main).toHaveAttribute('data-silly-mode', 'normal');
	await expect(
		page.getByRole('heading', { level: 1, name: 'WELCOME TO MY WEBSITE!!!' })
	).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: ': : MENU : :' })).toBeVisible();

	const darkToggle = page.getByRole('button', { name: /DARK MODE/i });
	await expect(darkToggle).toHaveAttribute('aria-pressed', 'false');
	await darkToggle.click();

	await expect(main).toHaveAttribute('data-silly-mode', 'horror');
	await expect(page.getByRole('button', { name: /EXIT BROADCAST/i })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByRole('button', { name: /TAPE AUDIO: OFF/i })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(
		page.getByRole('heading', { level: 1, name: 'THIS BROADCAST HAS ENDED' })
	).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: ': : DOORS : :' })).toBeVisible();
	await expect(
		page.getByRole('heading', { level: 2, name: '< EMERGENCY ARCHIVE >' })
	).toBeVisible();
	await expect(html).not.toHaveClass(/dark/);
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
	expect(await page.evaluate(() => localStorage.getItem('silly-horror-mode'))).toBe('1');

	await page.getByRole('button', { name: 'DO NOT PRESS' }).click();
	await expect(page.getByText('It heard that.')).toBeVisible();

	const firstRecord = await page.locator('div[role="status"] p').first().textContent();
	await page.getByRole('button', { name: 'RETRIEVE NEXT RECORD →' }).click();
	const secondRecord = await page.locator('div[role="status"] p').first().textContent();
	expect(secondRecord).not.toBe(firstRecord);

	await page.reload({ waitUntil: 'networkidle' });
	await expect(main).toHaveAttribute('data-silly-mode', 'horror');
	await expect(
		page.getByRole('heading', { level: 1, name: 'THIS BROADCAST HAS ENDED' })
	).toBeVisible();

	const sillyDimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(sillyDimensions.scrollWidth).toBeLessThanOrEqual(sillyDimensions.clientWidth);

	await page.getByRole('link', { name: '> About Me' }).click();
	await page.waitForURL('**/silly/who-is-ramis-bhatty');
	await expect(main).toHaveAttribute('data-silly-mode', 'horror');
	await expect(page.getByText('CASE FILE 04 // SIGNAL RECOVERED')).toBeVisible();
	await expect(html).not.toHaveClass(/dark/);

	const bioDimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(bioDimensions.scrollWidth).toBeLessThanOrEqual(bioDimensions.clientWidth);
	const bioAxe = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
	expect(bioAxe.violations).toEqual([]);

	await page.getByRole('link', { name: 'Suspiciously normal website' }).click();
	await page.waitForURL(`${new URL(page.url()).origin}/`);
	await expect(html).not.toHaveClass(/dark/);

	await page.goto('/silly', { waitUntil: 'networkidle' });
	await expect(main).toHaveAttribute('data-silly-mode', 'horror');
	await page.getByRole('button', { name: /EXIT BROADCAST/i }).click();
	await expect(main).toHaveAttribute('data-silly-mode', 'normal');
	await expect(
		page.getByRole('heading', { level: 1, name: 'WELCOME TO MY WEBSITE!!!' })
	).toBeVisible();
	expect(await page.evaluate(() => localStorage.getItem('silly-horror-mode'))).toBe('0');

	await page.reload({ waitUntil: 'networkidle' });
	await expect(main).toHaveAttribute('data-silly-mode', 'normal');
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
	expect(sitemapBody).toContain('<loc>https://ramisbhatty.com/cv</loc>');
	expect(sitemapBody).toContain(
		'<loc>https://ramisbhatty.com/work/experience/research-internship</loc>'
	);
	expect(sitemapBody).toContain(
		'<loc>https://ramisbhatty.com/work/go2-lidar-perception/poster</loc>'
	);
	expect(sitemapBody).not.toContain('<loc>https://ramisbhatty.com/about</loc>');
	expect(sitemapBody).not.toContain('<loc>https://ramisbhatty.com/work</loc>');
	expect(sitemapBody).not.toContain('<loc>https://ramisbhatty.com/blog</loc>');
	expect(sitemapBody).not.toContain('<loc>https://ramisbhatty.com/interests</loc>');
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

test('removed sections are not served', async ({ request }) => {
	for (const path of ['/about', '/work', '/interests', '/interests/games']) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(404);
	}
});

test('/cv is a printable HTML CV with linked evidence', async ({ page }) => {
	const response = await page.goto('/cv');
	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Curriculum Vitae \| Ramis Bhatty$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Ramis Bhatty' })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: 'Education' })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: 'Experience' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Full education record/i })).toHaveAttribute(
		'href',
		'/education'
	);
	await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		'/documents/ramis-bhatty-cv.pdf'
	);

	const internalLink = page.getByRole('link', { name: /Full education record/i });
	const githubLink = page.getByRole('link', { name: 'github.com/Strawma', exact: true });
	const linkedinLink = page.getByRole('link', { name: 'linkedin.com/in/ramis-bhatty' });
	await expect(internalLink).toBeVisible();
	await expect(githubLink).toBeVisible();
	await expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/ramis-bhatty/');

	await page.emulateMedia({ media: 'print' });
	await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
	await expect(page.getByRole('contentinfo')).toBeHidden();
	await expect(internalLink).toBeHidden();
	await expect(githubLink).toBeVisible();
});

test('the generated CV PDF is available as a download', async ({ request }) => {
	const response = await request.get('/documents/ramis-bhatty-cv.pdf');

	expect(response.ok()).toBe(true);
	expect(response.headers()['content-type']).toContain('application/pdf');
	expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

test('detail pages show connected backlinks without duplicating structured links and hide them in print', async ({
	page
}) => {
	await page.goto('/work/go2-lidar-perception');
	const go2Connections = page.getByRole('complementary', { name: 'Connected pages' });
	await expect(
		go2Connections.getByRole('heading', { level: 2, name: 'Mentioned by' })
	).toBeVisible();
	await expect(
		go2Connections.locator('a[href="/work/experience/research-internship"]')
	).toBeVisible();
	await expect(go2Connections.locator('a[href="/work/go2-lidar-perception/poster"]')).toBeVisible();
	await expect(go2Connections.locator('a[href="/"]')).toBeVisible();

	await page.emulateMedia({ media: 'print' });
	await expect(go2Connections).toBeHidden();
	await page.emulateMedia({ media: 'screen' });

	await page.goto('/work/cell-migration-segmentation');
	const cellConnections = page.getByRole('complementary', { name: 'Connected pages' });
	await expect(cellConnections.locator('a[href="/cv"]')).toBeVisible();
	await expect(cellConnections.locator('a[href="/"]')).toBeVisible();

	await page.goto('/education/comp3200');
	await expect(page.locator('a[href="/work/cell-migration-segmentation"]')).toHaveCount(1);
	const comp3200Connections = page.getByRole('complementary', { name: 'Connected pages' });
	await expect(comp3200Connections.getByRole('link', { name: '← Education' })).toHaveAttribute(
		'href',
		'/education'
	);

	await page.goto('/education/comp1201');
	const comp1201Connections = page.getByRole('complementary', { name: 'Connected pages' });
	await expect(comp1201Connections.getByRole('link', { name: '← Education' })).toHaveAttribute(
		'href',
		'/education'
	);
});

test('all rendered internal links and static assets across main routes resolve with 200', async ({
	page,
	request
}) => {
	const checkedTargets = new Set<string>();
	const routesToInspect = [
		'/',
		'/cv',
		'/education',
		'/work/go2-lidar-perception',
		'/work/go2-lidar-perception/poster',
		'/work/cell-migration-segmentation',
		'/work/experience/research-internship',
		'/education/comp3200'
	];

	for (const routePath of routesToInspect) {
		await page.goto(routePath);
		const targets = await page.evaluate(() => {
			const origin = window.location.origin;
			const urls = [
				...Array.from(document.querySelectorAll<HTMLAnchorElement>('main a[href]')).map(
					(el) => el.href
				),
				...Array.from(document.querySelectorAll<HTMLImageElement>('main img[src]')).map(
					(el) => el.src
				)
			];
			return urls
				.filter((url) => url.startsWith(`${origin}/`))
				.map((url) => {
					const parsed = new URL(url);
					return `${parsed.pathname}${parsed.search}`;
				});
		});

		for (const target of targets) {
			if (!target || checkedTargets.has(target)) continue;
			checkedTargets.add(target);
			const response = await request.get(target);
			expect(response.status(), `${routePath} -> ${target}`).toBe(200);
		}
	}

	expect(checkedTargets.has('/documents/ramis-bhatty-cv.pdf')).toBe(true);
	expect(checkedTargets.has('/documents/go2-lidar-poster.pdf')).toBe(true);
	expect(checkedTargets.has('/images/projects/cell-migration/dice-by-clip.svg')).toBe(true);
});

test('main-content links share underline and focus styles in screen mode and drop underlines in print', async ({
	page
}) => {
	await page.goto('/');
	const cvLink = page.locator('#main-content section a[href="/cv"]');
	await expect(cvLink).toHaveCSS('text-decoration-line', 'underline');

	await cvLink.focus();
	await expect(cvLink).toBeFocused();
	await expect(cvLink).toHaveCSS('outline-style', 'solid');
	await expect(cvLink).toHaveCSS('outline-width', '2px');

	await page.emulateMedia({ media: 'print' });
	await expect(cvLink).toHaveCSS('text-decoration-line', 'none');
});

test('the unpublished blog index and RSS endpoint preview cleanly in local dev', async ({
	page,
	request
}) => {
	await page.setViewportSize({ width: 360, height: 740 });
	const response = await page.goto('/blog', { waitUntil: 'networkidle' });
	expect(response?.ok()).toBe(true);
	await expect(page).toHaveTitle(/^Blog \| Ramis Bhatty$/);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
	await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
	await expect(page.getByText('LOCAL PREVIEW', { exact: true })).toBeVisible();

	const dimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

	const lightAccessibility = await new AxeBuilder({ page }).analyze();
	expect(lightAccessibility.violations).toEqual([]);

	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/blog', { waitUntil: 'networkidle' });
	await expect(page.locator('html')).toHaveClass(/dark/);
	const darkAccessibility = await new AxeBuilder({ page }).analyze();
	expect(darkAccessibility.violations).toEqual([]);

	const rss = await request.get('/blog/rss.xml');
	expect(rss.ok()).toBe(true);
	expect(rss.headers()['content-type']).toContain('application/rss+xml');
	const rssBody = await rss.text();
	expect(rssBody).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
});

test('unknown authored records return not found', async ({ request }) => {
	for (const path of ['/work/not-a-project', '/education/not-a-module', '/blog/not-a-post']) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(404);
	}
});
