import { dev } from '$app/env';
import { featuredProjects, pageIntroductions, visibleProjects } from '#lib/content.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const projects = visibleProjects(dev);
	const selectedProjects = featuredProjects(dev);

	return {
		page: pageIntroductions.home,
		projects: selectedProjects.length ? selectedProjects : projects
	};
};
