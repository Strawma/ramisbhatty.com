import { dev } from '$app/env';
import { error } from '@sveltejs/kit';
import { findModule, visibleProjects } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const module = findModule(params.code, dev);
	if (!module) error(404, 'Module not found');

	return {
		module,
		projects: visibleProjects(dev).filter((project) => project.moduleCode === module.code)
	};
};
