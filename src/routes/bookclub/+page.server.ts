import { fail, redirect } from '@sveltejs/kit';
import { requireBookclubMember } from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import {
	createCycle,
	deleteSuggestion,
	drawCycle,
	getDashboard,
	saveSuggestion
} from '$lib/server/bookclub/cycles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const database = getBookclubDatabase(event.platform);

	return { member, dashboard: await getDashboard(database, member) };
};

export const actions: Actions = {
	createCycle: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can open a cycle.' });
		}

		const database = getBookclubDatabase(event.platform);
		const dashboard = await getDashboard(database, member);
		const form = await event.request.formData();
		const label = form.get('label');

		if (dashboard.activeCycle) {
			return fail(400, { error: 'Close or draw the current cycle before opening another.' });
		}

		if (typeof label !== 'string' || label.trim().length === 0 || label.trim().length > 80) {
			return fail(400, { error: 'Give the new cycle a short label.' });
		}

		await createCycle(database, label.trim());
		return { success: 'A new suggestion cycle is open.' };
	},

	saveSuggestion: async (event) => {
		const member = await requireBookclubMember(event);
		const database = getBookclubDatabase(event.platform);
		const dashboard = await getDashboard(database, member);
		const form = await event.request.formData();
		const position = Number(form.get('position'));
		const suggestionId = form.get('suggestionId');
		const title = form.get('title');
		const author = form.get('author');

		if (!dashboard.activeCycle) {
			return fail(400, { error: 'There is no open suggestion cycle.' });
		}

		if (!Number.isInteger(position) || position < 1 || position > 3) {
			return fail(400, { error: 'Choose a valid suggestion slot.' });
		}

		if (
			typeof title !== 'string' ||
			title.trim().length === 0 ||
			title.trim().length > 200 ||
			typeof author !== 'string' ||
			author.trim().length === 0 ||
			author.trim().length > 120
		) {
			return fail(400, { error: 'Enter a title and author within the allowed lengths.' });
		}

		if (
			typeof suggestionId !== 'string' &&
			dashboard.mySuggestions.some((item) => item.position === position)
		) {
			return fail(400, { error: 'That suggestion slot is already occupied.' });
		}

		try {
			await saveSuggestion(
				database,
				dashboard.activeCycle.id,
				member.id,
				position,
				title.trim(),
				author.trim(),
				typeof suggestionId === 'string' && suggestionId.length > 0 ? suggestionId : undefined
			);
		} catch {
			return fail(400, { error: 'That suggestion could not be saved.' });
		}

		return { success: 'Suggestion saved.' };
	},

	deleteSuggestion: async (event) => {
		const member = await requireBookclubMember(event);
		const form = await event.request.formData();
		const suggestionId = form.get('suggestionId');

		if (typeof suggestionId !== 'string' || suggestionId.length === 0) {
			return fail(400, { error: 'The suggestion could not be identified.' });
		}

		await deleteSuggestion(getBookclubDatabase(event.platform), suggestionId, member.id);
		return { success: 'Suggestion removed.' };
	},

	draw: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can run the draw.' });
		}

		const database = getBookclubDatabase(event.platform);
		const dashboard = await getDashboard(database, member);

		if (!dashboard.activeCycle) {
			return fail(400, { error: 'There is no open cycle to draw.' });
		}

		const form = await event.request.formData();
		const allowIncomplete = form.get('allowIncomplete') === 'on';

		try {
			await drawCycle(database, dashboard.activeCycle.id, member.id, allowIncomplete);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'The draw could not be completed.'
			});
		}

		throw redirect(303, '/bookclub#current-book');
	}
};
