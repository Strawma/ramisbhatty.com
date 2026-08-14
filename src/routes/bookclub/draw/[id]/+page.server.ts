import { error } from '@sveltejs/kit';
import { requireBookclubMember } from '#lib/server/bookclub/auth';
import { getDrawReplay } from '#lib/server/bookclub/cycles';
import { getBookclubDatabase } from '#lib/server/bookclub/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const replay = await getDrawReplay(getBookclubDatabase(event.platform), event.params.id);
	if (!replay) throw error(404, 'That book draw could not be found.');

	return { member, replay };
};
