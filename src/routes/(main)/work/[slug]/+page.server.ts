import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { findModule, findProject } from '$lib/data/main-site';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = findProject(params.slug, dev);
	if (!project) error(404, 'Project not found');

	return {
		project,
		module: project.moduleCode ? findModule(project.moduleCode, dev) : undefined
	};
};
