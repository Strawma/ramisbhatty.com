import { dev } from '$app/environment';
import { findPost } from '$lib/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const post = findPost(params.slug, dev);
	if (!post) error(404, 'Post not found');

	return { post };
};
