import { error, fail, redirect } from '@sveltejs/kit';
import { requireBookclubMember } from '#lib/server/bookclub/auth';
import { getDrawReplay, rerollCycle, setBookCover } from '#lib/server/bookclub/cycles';
import { getBookclubDatabase } from '#lib/server/bookclub/db';
import { findBookCover } from '#lib/server/bookclub/covers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const replay = await getDrawReplay(getBookclubDatabase(event.platform), event.params.id);
	if (!replay) throw error(404, 'That book draw could not be found.');

	return { member, replay };
};

export const actions: Actions = {
	reroll: async (event) => {
		const member = await requireBookclubMember(event);
		if (member.role !== 'admin')
			return fail(403, { error: 'Only the club admin can reroll a book.' });
		const form = await event.request.formData();
		const drawId = form.get('drawId');
		const reason = form.get('reason');
		if (typeof drawId !== 'string' || !drawId || typeof reason !== 'string') {
			return fail(400, { error: 'Choose a saved result and enter a reason.' });
		}
		const database = getBookclubDatabase(event.platform);
		let book;
		try {
			book = await rerollCycle(database, event.params.id, drawId, member.id, reason);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'The reroll could not be completed.'
			});
		}
		// Cover lookup must not turn a persisted replacement into an apparent failure.
		try {
			const coverUrl = await findBookCover(event.fetch, book.title, book.author);
			if (coverUrl) await setBookCover(database, book.id, coverUrl);
		} catch {
			// A replacement remains usable without a cover.
		}
		throw redirect(303, `/bookclub/draw/${event.params.id}`);
	}
};
