import { dev } from '$app/environment';
import { personal, visibleModules, visibleProjects } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	personal,
	modules: visibleModules(dev),
	projects: visibleProjects(dev)
});
