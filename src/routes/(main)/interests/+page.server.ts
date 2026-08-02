import { dev } from '$app/env';
import { pageIntroductions, visibleInterests } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.interests,
	interests: visibleInterests(dev),
	hasPublishedInterests: visibleInterests().length > 0
});
