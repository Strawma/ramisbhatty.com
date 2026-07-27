import { dev } from '$app/environment';
import { pageIntroductions, visiblePosts } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.blog,
	posts: visiblePosts(dev)
});
