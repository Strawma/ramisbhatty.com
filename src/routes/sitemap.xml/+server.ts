import {
	visibleExperience,
	visibleInterests,
	visibleModules,
	visiblePosts,
	visibleProjects
} from '#lib/content';
import { site } from '#lib/data/config';
import type { RequestHandler } from './$types';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function absoluteUrl(path: string): string {
	return new URL(path, `${site.origin}/`).href;
}

export const GET: RequestHandler = () => {
	// Keep the sitemap aligned with production visibility. Draft records and utility sections with
	// `noindex` metadata are deliberately omitted so the discovery signal stays unambiguous.
	const paths = new Set([
		'/',
		'/about',
		'/work',
		'/education',
		'/silly',
		'/silly/who-is-ramis-bhatty',
		...visibleExperience().map((entry) => `/work/experience/${entry.slug}`),
		...visibleProjects().map((project) => `/work/${project.slug}`),
		...visibleModules().map((module) => `/education/${module.slug}`)
	]);

	const posts = visiblePosts();
	if (posts.length) {
		paths.add('/blog');
		for (const post of posts) paths.add(`/blog/${post.slug}`);
	}

	const interests = visibleInterests();
	if (interests.length) {
		paths.add('/interests');
		for (const interest of interests) paths.add(`/interests/${interest.slug}`);
	}

	const urls = [...paths]
		.map(absoluteUrl)
		.sort((left, right) => left.localeCompare(right, 'en-GB'));
	const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'cache-control': 'public, max-age=3600',
			'content-type': 'application/xml; charset=utf-8'
		}
	});
};
