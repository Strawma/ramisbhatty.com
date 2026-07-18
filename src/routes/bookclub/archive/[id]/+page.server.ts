import { error } from '@sveltejs/kit';
import { requireBookclubMember } from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import { getArchiveEntry } from '$lib/server/bookclub/cycles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({
		'cache-control': 'no-store',
		'referrer-policy': 'no-referrer'
	});
	const member = await requireBookclubMember(event);

	const entry = await getArchiveEntry(getBookclubDatabase(event.platform), event.params.id);
	if (!entry) throw error(404, 'That archived book could not be found.');

	return { member, entry };
};
