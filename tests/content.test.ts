import { describe, expect, it } from 'vitest';
import {
	experience,
	findExperience,
	findModule,
	findProject,
	modules,
	projects,
	visibleExperience,
	visibleModules,
	visibleProjects
} from '../src/lib/content';
import {
	extractMarkdownInternalLinks,
	findBrokenInternalLinks,
	getPageConnections,
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
});
