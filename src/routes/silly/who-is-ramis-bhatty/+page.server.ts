import { pageIntroductions } from '#lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions['who-is-ramis-bhatty']
});
