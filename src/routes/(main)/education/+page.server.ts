import { dev } from '$app/environment';
import { pageIntroductions, visibleModules } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.education,
	modules: visibleModules(dev)
});
