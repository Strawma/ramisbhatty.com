import { dev } from '$app/env';
import { pageIntroductions, visibleExperience, visibleProjects } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.work,
	experience: visibleExperience(dev),
	projects: visibleProjects(dev)
});
