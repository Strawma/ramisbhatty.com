import { dev } from '$app/environment';
import { education, pageIntroductions, visibleModules } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.education,
	education,
	modules: visibleModules(dev)
});
