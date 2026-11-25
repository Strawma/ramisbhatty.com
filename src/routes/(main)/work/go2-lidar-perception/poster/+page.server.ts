import { dev } from '$app/env';
import { pageIntroductions } from '#lib/content.ts';
import { getPageConnections } from '#lib/content-links.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	page: pageIntroductions['go2-poster'],
	connections: getPageConnections('/work/go2-lidar-perception/poster', {
		includeDrafts: dev
	})
});
