import { dev } from '$app/environment';
import { aboutSiteCopy, pageIntroductions, personal, visibleExperience } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.about,
	personal,
	experience: visibleExperience(dev),
	siteCopy: aboutSiteCopy
});
