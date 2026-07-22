import { dev } from '$app/environment';
import { profile, visibleModules, visibleProjects } from '$lib/data/main-site';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	profile,
	modules: visibleModules(dev),
	projects: visibleProjects(dev)
});
