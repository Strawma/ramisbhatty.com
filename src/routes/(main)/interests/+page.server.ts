import { dev } from '$app/environment';
import { pageIntroductions, visibleInterests } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions.interests,
	interests: visibleInterests(dev)
});
