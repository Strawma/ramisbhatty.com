import { dev } from '$app/env';
import { error } from '@sveltejs/kit';
import { findModule, visibleProjects } from '#lib/content.ts';
import { getPageConnections } from '#lib/content-links.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const module = findModule(params.code, dev);
	if (!module) error(404, 'Module not found');

	const projects = visibleProjects(dev).filter((project) => project.moduleCode === module.code);

	return {
		module,
		projects,
		connections: getPageConnections(`/education/${module.slug}`, {
			includeDrafts: dev,
			excludeMentionedBy: projects.map((project) => `/work/${project.slug}`)
		})
	};
};
