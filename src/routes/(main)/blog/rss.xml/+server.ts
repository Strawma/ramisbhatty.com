import { dev } from '$app/env';
import { buildBlogRssXml } from '#lib/blog-rss.ts';
import { visibleBlogPosts } from '#lib/content.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const posts = visibleBlogPosts(false);
	if (!dev && posts.length === 0) {
		return new Response('Not found', { status: 404 });
	}

	return new Response(buildBlogRssXml(posts), {
		headers: {
			'cache-control': 'public, max-age=3600',
			'content-type': 'application/rss+xml; charset=utf-8'
		}
	});
};
