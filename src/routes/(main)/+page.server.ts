import { dev } from '$app/environment';
import {
	exploreDestinations,
	featuredModules,
	featuredProjects,
	personal,
	visibleModules,
	visibleProjects
} from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const projects = visibleProjects(dev);
	const modules = visibleModules(dev);
	const selectedProjects = featuredProjects(dev);
	const selectedModules = featuredModules(dev);

	return {
		personal,
		exploreDestinations,
		modules: selectedModules.length ? selectedModules : modules,
		projects: selectedProjects.length ? selectedProjects : projects
	};
};
