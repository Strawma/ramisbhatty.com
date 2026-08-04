import { dev } from '$app/env';
import { findExperience } from '#lib/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const experience = findExperience(params.slug, dev);
	if (!experience) error(404, 'Experience not found');

	return { experience };
};
