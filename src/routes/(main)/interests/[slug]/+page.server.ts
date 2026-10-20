import { dev } from '$app/env';
import { findInterest } from '#lib/content.ts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const category = findInterest(params.slug, dev);
	if (!category) error(404, 'Interest category not found');

	return { category };
};
