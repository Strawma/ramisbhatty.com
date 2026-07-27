import { dev } from '$app/environment';
import { pageIntroductions, visibleExperience, visibleProjects } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.work,
	experience: visibleExperience(dev),
	projects: visibleProjects(dev)
});
