import { describe, expect, it } from 'vitest';
import {
	blogPosts,
	experience,
	findBlogPost,
	findExperience,
	findModule,
	findProject,
	formatIsoDate,
	hasPublishedBlogPosts,
	modules,
	projects,
	visibleBlogPosts,
	visibleExperience,
	visibleModules,
	visibleProjects
} from '../src/lib/content';
import { buildBlogRssXml } from '../src/lib/blog-rss';
import {
	createContentLinkGraph,
	extractMarkdownInternalLinks,
	extractMarkdownSelfOriginLinks,
	extractMarkdownStaticAssets,
	findBrokenInternalLinks,
	getPageConnections,
	getReferencedStaticAssets,
	isSelfOriginUrl,
	normalizeInternalPath
} from '../src/lib/content-links';

describe('main-site content visibility', () => {
	it('returns only published records from production selectors', () => {
		expect(visibleExperience()).toEqual(experience.filter((entry) => entry.status === 'published'));
		expect(visibleModules()).toEqual(modules.filter((module) => module.status === 'published'));
		expect(visibleProjects()).toEqual(projects.filter((project) => project.status === 'published'));
	});

	it('includes drafts only when explicitly requested', () => {
		expect(visibleExperience(true)).toEqual(experience);
		expect(visibleModules(true)).toEqual(modules);
		expect(visibleProjects(true)).toEqual(projects);
	});

	it('does not resolve draft detail pages in production', () => {
		for (const entry of experience.filter((item) => item.status === 'draft')) {
			expect(findExperience(entry.slug)).toBeUndefined();
			expect(findExperience(entry.slug, true)).toEqual(entry);
		}
		for (const module of modules.filter((item) => item.status === 'draft')) {
			expect(findModule(module.code)).toBeUndefined();
			expect(findModule(module.code, true)).toEqual(module);
		}
		for (const project of projects.filter((item) => item.status === 'draft')) {
			expect(findProject(project.slug)).toBeUndefined();
			expect(findProject(project.slug, true)).toEqual(project);
		}
	});

	it('keeps module marks within percentage bounds when provided', () => {
		expect(
			modules.every(
				(module) => module.mark === undefined || (module.mark >= 0 && module.mark <= 100)
			)
		).toBe(true);
	});

	it('uses the correct marks and credit weighting metadata', () => {
		expect(findModule('MATH3082', true)).toMatchObject({
			title: 'Optimisation',
			mark: 88,
			credits: 15
		});
		expect(findModule('COMP3200', true)?.credits).toBe(45);
		expect(
			modules
				.filter((module) => module.code !== 'COMP3200')
				.every((module) => module.credits === 15)
		).toBe(true);
	});
});

describe('internal link extraction and backlinks', () => {
	it('normalizes internal paths and ignores external or non-path links', () => {
		expect(normalizeInternalPath('/')).toBe('/');
		expect(normalizeInternalPath('/education/COMP3200/')).toBe('/education/comp3200');
		expect(normalizeInternalPath('/work/go2-lidar-perception?view=1#results')).toBe(
			'/work/go2-lidar-perception'
		);
		expect(normalizeInternalPath('https://example.com/path')).toBeUndefined();
		expect(normalizeInternalPath('//cdn.example.com/asset')).toBeUndefined();
		expect(normalizeInternalPath('mailto:contact@ramisbhatty.com')).toBeUndefined();
		expect(normalizeInternalPath('#section')).toBeUndefined();
		expect(normalizeInternalPath('relative/path')).toBeUndefined();
		expect(normalizeInternalPath('   ')).toBeUndefined();
	});

	it('extracts internal Markdown and HTML links while ignoring code and images', () => {
		const markdown = `---
title: Example
---

See [LiDAR](/work/go2-lidar-perception "Title") and [COMP3200](/education/COMP3200#results).
Also [ref link][ref] and <a href="/CV/?print=1">CV</a> and [duplicate](/work/go2-lidar-perception).
Ignore ![diagram](/images/example.png), [external](https://github.com/Strawma), and \`[inline](/work/ignored)\`.

\`\`\`md
[fenced](/work/ignored-fenced)
<a href="/education/ignored">ignored</a>
\`\`\`

~~~markdown
[tilde](/work/ignored-tilde)
~~~

Check \`\`[multi-tick](/work/ignored-multi)\`\` and [home](/).

[ref]: /work/experience/research-internship "Internship"
`;

		expect(extractMarkdownInternalLinks(markdown)).toEqual([
			'/work/go2-lidar-perception',
			'/education/comp3200',
			'/cv',
			'/',
			'/work/experience/research-internship'
		]);
	});

	it('builds deterministic backlinks across published main-site pages', () => {
		const go2 = getPageConnections('/work/go2-lidar-perception');
		expect(go2.mentionedBy.map((item) => item.path)).toEqual([
			'/work/experience/research-internship',
			'/work/go2-lidar-perception/poster',
			'/'
		]);

		const cell = getPageConnections('/work/cell-migration-segmentation');
		expect(cell.mentionedBy.map((item) => item.path)).toEqual(['/cv', '/']);

		const internship = getPageConnections('/work/experience/research-internship');
		expect(internship.mentionedBy.map((item) => item.path)).toEqual([
			'/work/go2-lidar-perception',
			'/cv'
		]);

		const poster = getPageConnections('/work/go2-lidar-perception/poster');
		expect(poster.mentionedBy.map((item) => item.path)).toEqual([
			'/work/go2-lidar-perception',
			'/work/experience/research-internship'
		]);
	});

	it('deduplicates structured links and keeps drafts out of production connections', () => {
		const comp3200Deduped = getPageConnections('/education/comp3200', {
			excludeMentionedBy: ['/work/cell-migration-segmentation']
		});
		expect(comp3200Deduped.mentionedBy).toEqual([]);

		const comp3200Raw = getPageConnections('/education/comp3200');
		expect(comp3200Raw.mentionedBy.map((item) => item.path)).toEqual([
			'/work/cell-migration-segmentation'
		]);

		expect(getPageConnections('/work/module-project-placeholder').mentionedBy).toEqual([]);
		expect(
			getPageConnections('/work/module-project-placeholder', {
				includeDrafts: true
			}).mentionedBy.map((item) => item.path)
		).toEqual(['/']);
	});

	it('validates that all internal links in main-site content resolve without draft leaks', () => {
		expect(findBrokenInternalLinks()).toEqual([]);
	});

	it('ignores comments, escapes, and indented code while preserving list continuations and nested links', () => {
		const markdown = `
- Item one
  [List continuation](/cv)

Paragraph before code.

    [Indented code](/work/ignored-indented)
    [Still indented](/work/ignored-indented-2)

<!-- [Commented link](/work/ignored-comment) -->

Escaped \\[not a link\\](/work/ignored-escape) and !\\[not image\\](/images/ignored.png).

Nested [Section [1]](/education/comp3200), balanced [Parens](/work/example(1)),
and linked image [![Chart](/images/projects/cell-migration/dice-by-clip.svg)](/work/cell-migration-segmentation).

<img src="/images/projects/extra.webp" alt="Extra" />
<a href="/documents/go2-lidar-poster.pdf">Poster</a>
`;

		expect(extractMarkdownInternalLinks(markdown)).toEqual([
			'/cv',
			'/education/comp3200',
			'/work/example(1)',
			'/work/cell-migration-segmentation',
			'/documents/go2-lidar-poster.pdf'
		]);

		expect(extractMarkdownStaticAssets(markdown)).toEqual([
			'/images/projects/cell-migration/dice-by-clip.svg',
			'/images/projects/extra.webp',
			'/documents/go2-lidar-poster.pdf'
		]);

		const assetRefs = getReferencedStaticAssets();
		expect(assetRefs).toContainEqual({
			sourcePath: '/work/go2-lidar-perception',
			target: '/documents/go2-lidar-poster.pdf'
		});
		expect(assetRefs).toContainEqual({
			sourcePath: '/work/cell-migration-segmentation',
			target: '/images/projects/cell-migration/dice-by-clip.svg'
		});
	});

	it('detects absolute same-origin URLs', () => {
		expect(isSelfOriginUrl('https://ramisbhatty.com/cv')).toBe(true);
		expect(isSelfOriginUrl('http://WWW.RAMISBHATTY.COM/work/go2-lidar-perception')).toBe(true);
		expect(isSelfOriginUrl('https://github.com/Strawma')).toBe(false);
		expect(isSelfOriginUrl('/cv')).toBe(false);
		expect(
			extractMarkdownSelfOriginLinks(
				'See [absolute](https://ramisbhatty.com/cv) and [ext](https://example.com).'
			)
		).toEqual(['https://ramisbhatty.com/cv']);
	});

	it('enforces link-graph invariants, related ordering, and broken-link diagnostics', () => {
		const graph = createContentLinkGraph({
			nodes: [
				{
					path: '/',
					slug: 'home',
					kind: 'page',
					title: 'Home',
					summary: 'Index',
					status: 'published'
				},
				{
					path: '/education',
					slug: 'education',
					kind: 'page',
					title: 'Education',
					summary: 'Study',
					status: 'published'
				},
				{
					path: '/work/alpha',
					slug: 'alpha',
					kind: 'project',
					title: 'Alpha',
					summary: 'Alpha summary',
					status: 'published',
					related: ['/work/beta', '/work/gamma-draft', '/work/beta']
				},
				{
					path: '/work/beta',
					slug: 'beta',
					kind: 'project',
					title: 'Beta',
					summary: 'Beta summary',
					status: 'published'
				},
				{
					path: '/work/gamma-draft',
					slug: 'gamma-draft',
					kind: 'project',
					title: 'Gamma',
					summary: 'Draft project',
					status: 'draft'
				},
				{
					path: '/work/delta-draft',
					slug: 'delta-draft',
					kind: 'project',
					title: 'Delta',
					summary: 'Another draft project',
					status: 'draft'
				}
			],
			markdownSources: [
				{
					sourcePath: '/work/alpha',
					rawMarkdown:
						'Self [here](/work/alpha#top), [beta](/work/beta), [missing](/work/nope), and [abs](https://www.ramisbhatty.com/education).'
				},
				{
					sourcePath: '/work/beta',
					rawMarkdown: 'Back to [alpha](/work/alpha) and [draft](/work/gamma-draft).'
				},
				{
					sourcePath: '/work/gamma-draft',
					rawMarkdown: 'Draft links to [beta](/work/beta) and [alpha](/work/alpha).'
				},
				{
					sourcePath: '/work/delta-draft',
					rawMarkdown: 'Second draft links to [alpha](/work/alpha).'
				},
				{
					sourcePath: '/education',
					rawMarkdown: 'Fragment link to [alpha](/work/alpha).'
				}
			],
			getHomeProjectPaths: () => []
		});

		const alphaProd = graph.getPageConnections('/work/alpha');
		expect(alphaProd.related.map((item) => item.path)).toEqual(['/work/beta']);
		expect(alphaProd.mentionedBy.map((item) => item.path)).toEqual(['/education']);

		const alphaDev = graph.getPageConnections('/work/alpha', { includeDrafts: true });
		expect(alphaDev.related.map((item) => item.path)).toEqual(['/work/beta', '/work/gamma-draft']);
		expect(alphaDev.mentionedBy.map((item) => item.path)).toEqual([
			'/work/delta-draft',
			'/education'
		]);

		expect(graph.findBrokenInternalLinks()).toEqual([
			{
				sourcePath: '/work/alpha',
				target: 'https://www.ramisbhatty.com/education',
				reason: 'absolute-self-url'
			},
			{ sourcePath: '/work/alpha', target: '/work/nope', reason: 'unknown' },
			{ sourcePath: '/work/beta', target: '/work/gamma-draft', reason: 'draft-target' },
			{ sourcePath: '/work/alpha', target: '/work/gamma-draft', reason: 'draft-target' }
		]);

		expect(() =>
			createContentLinkGraph({
				nodes: [
					{
						path: '/work/a',
						slug: 'a',
						kind: 'project',
						title: 'A',
						summary: 'A',
						status: 'published',
						related: ['/work/missing']
					}
				],
				markdownSources: [],
				getHomeProjectPaths: () => []
			})
		).toThrow(/unknown related path/);

		expect(() =>
			createContentLinkGraph({
				nodes: [
					{
						path: '/work/a',
						slug: 'a',
						kind: 'project',
						title: 'A',
						summary: 'A',
						status: 'published',
						related: ['https://example.com']
					}
				],
				markdownSources: [],
				getHomeProjectPaths: () => []
			})
		).toThrow(/unknown related path/);

		expect(() =>
			createContentLinkGraph({
				nodes: [
					{
						path: '/work/a',
						slug: 'a',
						kind: 'project',
						title: 'A',
						summary: 'A',
						status: 'published',
						related: ['/work/a']
					}
				],
				markdownSources: [],
				getHomeProjectPaths: () => []
			})
		).toThrow(/cannot reference itself/);

		expect(() =>
			createContentLinkGraph({
				nodes: [
					{
						path: '/work/a',
						slug: 'a',
						kind: 'project',
						title: 'A',
						summary: 'A',
						status: 'published'
					},
					{
						path: '/work/a',
						slug: 'a',
						kind: 'project',
						title: 'A2',
						summary: 'A2',
						status: 'published'
					}
				],
				markdownSources: [],
				getHomeProjectPaths: () => []
			})
		).toThrow(/Duplicate content node path/);

		expect(() =>
			createContentLinkGraph({
				nodes: [],
				markdownSources: [{ sourcePath: '/work/unmapped', rawMarkdown: '' }],
				getHomeProjectPaths: () => []
			})
		).toThrow(/Unmapped markdown source path/);
	});
});

describe('blog framework and RSS feed', () => {
	it('keeps blog posts hidden until published and formats ISO dates cleanly', () => {
		expect(visibleBlogPosts()).toEqual(blogPosts.filter((post) => post.status === 'published'));
		expect(hasPublishedBlogPosts()).toBe(visibleBlogPosts(false).length > 0);
		expect(findBlogPost('non-existent-post', true)).toBeUndefined();
		expect(formatIsoDate('2026-11-25')).toBe('25 November 2026');
	});

	it('builds valid RSS 2.0 XML from published posts sorted newest-first', () => {
		const xml = buildBlogRssXml([
			{
				slug: 'older-post',
				title: 'Older & Wiser <Note>',
				summary: 'Summary with "quotes" & \'apostrophes\'.',
				publishedAt: '2026-10-01',
				topics: ['Systems', 'C++ & Rust'],
				status: 'published'
			},
			{
				slug: 'draft-post',
				title: 'Secret Draft',
				summary: 'Should not appear in RSS.',
				publishedAt: '2026-12-01',
				topics: ['Private'],
				status: 'draft'
			},
			{
				slug: 'newer-post',
				title: 'Newer Post',
				summary: 'Most recent post.',
				publishedAt: '2026-11-25',
				topics: ['SvelteKit'],
				status: 'published'
			}
		]);

		expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
		expect(xml).toContain('<lastBuildDate>Wed, 25 Nov 2026 00:00:00 GMT</lastBuildDate>');
		expect(xml).not.toContain('Secret Draft');
		expect(xml).toContain('<title>Older &amp; Wiser &lt;Note&gt;</title>');
		expect(xml).toContain(
			'<description>Summary with &quot;quotes&quot; &amp; &apos;apostrophes&apos;.</description>'
		);
		expect(xml).toContain('<category>C++ &amp; Rust</category>');
		expect(xml).toContain(
			'<guid isPermaLink="true">https://ramisbhatty.com/blog/newer-post</guid>'
		);

		const newerIndex = xml.indexOf('https://ramisbhatty.com/blog/newer-post');
		const olderIndex = xml.indexOf('https://ramisbhatty.com/blog/older-post');
		expect(newerIndex).toBeGreaterThan(-1);
		expect(olderIndex).toBeGreaterThan(newerIndex);

		const emptyXml = buildBlogRssXml([]);
		expect(emptyXml).toContain('<channel>');
		expect(emptyXml).not.toContain('<item>');
		expect(emptyXml).not.toContain('<lastBuildDate>');
	});

	it('connects blog nodes via backlinks and treats unpublished /blog as a draft target', () => {
		const graph = createContentLinkGraph({
			nodes: [
				{
					path: '/blog',
					slug: 'blog',
					kind: 'page',
					title: 'Blog',
					summary: 'Writing',
					status: 'draft'
				},
				{
					path: '/blog/workers-notes',
					slug: 'workers-notes',
					kind: 'blog',
					title: 'Workers Notes',
					summary: 'Notes on Workers',
					status: 'published',
					related: ['/work/site']
				},
				{
					path: '/work/site',
					slug: 'site',
					kind: 'project',
					title: 'Personal Site',
					summary: 'Website project',
					status: 'published'
				}
			],
			markdownSources: [
				{
					sourcePath: '/work/site',
					rawMarkdown: 'See [Workers Notes](/blog/workers-notes) and [Blog](/blog).'
				},
				{
					sourcePath: '/blog/workers-notes',
					rawMarkdown: 'Built for [Personal Site](/work/site).'
				}
			],
			getHomeProjectPaths: () => []
		});

		const postConnections = graph.getPageConnections('/blog/workers-notes');
		expect(postConnections.related.map((item) => item.path)).toEqual(['/work/site']);
		expect(postConnections.mentionedBy).toEqual([]);

		const siteConnections = graph.getPageConnections('/work/site');
		expect(siteConnections.mentionedBy.map((item) => item.path)).toEqual(['/blog/workers-notes']);

		expect(graph.findBrokenInternalLinks()).toEqual([
			{ sourcePath: '/work/site', target: '/blog', reason: 'draft-target' }
		]);
	});
});
