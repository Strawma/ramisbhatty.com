import { dev } from '$app/env';
import { pageIntroductions, visiblePosts } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.blog,
	posts: visiblePosts(dev),
	hasPublishedPosts: visiblePosts().length > 0
});
