import { dev } from '$app/env';
import { error } from '@sveltejs/kit';
import { findModule, findProject } from '#lib/content.ts';
import { getPageConnections } from '#lib/content-links.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = findProject(params.slug, dev);
	if (!project) error(404, 'Project not found');

	const module = project.moduleCode ? findModule(project.moduleCode, dev) : undefined;

	return {
		project,
		module,
		connections: getPageConnections(`/work/${project.slug}`, {
			includeDrafts: dev,
			excludeMentionedBy: module ? [`/education/${module.slug}`] : []
		})
	};
};
