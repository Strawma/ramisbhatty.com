import { dev } from '$app/env';
import { findBlogPost } from '#lib/content.ts';
import { getPageConnections } from '#lib/content-links.ts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const post = findBlogPost(params.slug, dev);
	if (!post) error(404, 'Post not found');

	return {
		post,
		connections: getPageConnections(`/blog/${post.slug}`, { includeDrafts: dev })
	};
};
