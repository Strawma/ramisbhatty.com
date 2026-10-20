import { dev } from '$app/env';
import { findPost } from '#lib/content.ts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const post = findPost(params.slug, dev);
	if (!post) error(404, 'Post not found');

	return { post };
};
