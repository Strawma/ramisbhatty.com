import { dev } from '$app/environment';
import { findInterest } from '$lib/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const category = findInterest(params.slug, dev);
	if (!category) error(404, 'Interest category not found');

	return { category };
};
