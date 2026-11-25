import { dev } from '$app/env';
import { hasPublishedBlogPosts, pageIntroductions, visibleBlogPosts } from '#lib/content.ts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const hasPublishedPosts = hasPublishedBlogPosts();
	if (!dev && !hasPublishedPosts) {
		error(404, 'Not found');
	}

	return {
		page: pageIntroductions.blog,
		posts: visibleBlogPosts(dev),
		hasPublishedPosts
	};
};
