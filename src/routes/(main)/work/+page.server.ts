import { dev } from '$app/env';
import { pageIntroductions, visibleProjects } from '#lib/content.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.work,
	projects: visibleProjects(dev)
});
