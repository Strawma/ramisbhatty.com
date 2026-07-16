import { requireBookclubMember } from '$lib/server/bookclub/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);

	return { member };
};
