import { dev } from '$app/env';
import { pageIntroductions, visibleExperience } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.about,
	experience: visibleExperience(dev)
});
