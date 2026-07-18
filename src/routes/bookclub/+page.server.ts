import { fail, redirect } from '@sveltejs/kit';
import { buildTimestamp } from '$lib/data/build-info';
import { requireBookclubMember } from '$lib/server/bookclub/auth';
import {
	ChatCooldownError,
	createChatMessage,
	restoreChatMessage,
	tombstoneChatMessageByAdmin,
	tombstoneOwnChatMessage
} from '$lib/server/bookclub/chat';
import { findBookCover } from '$lib/server/bookclub/covers';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import {
	closeCycle,
	createCycle,
	deleteSuggestion,
	drawCycle,
	getDashboard,
	getLatestActionCycle,
	saveSuggestion,
	setBookCover
} from '$lib/server/bookclub/cycles';
import { clearNextMeeting, scheduleNextMeeting } from '$lib/server/bookclub/meetings';
import { setMemberChatColor, setMemberDisplayName } from '$lib/server/bookclub/invitations';
import { isValidChatColor, normalizeChatColor } from '$lib/server/bookclub/colors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const database = getBookclubDatabase(event.platform);
	const dashboard = await getDashboard(database, member);

	return { member, dashboard, buildTimestamp };
};

export const actions: Actions = {
	createCycle: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can open a book poll.' });
		}

		const database = getBookclubDatabase(event.platform);
		const actionCycle = await getLatestActionCycle(database);

		if (actionCycle) {
			return fail(400, { error: 'Close the current book poll and spin the next book first.' });
		}

		try {
			await createCycle(database);
		} catch {
			return fail(400, { error: 'A book poll is already open.' });
		}
		return { success: 'A new book poll is open.' };
	},

	saveSuggestion: async (event) => {
		const member = await requireBookclubMember(event);
		const database = getBookclubDatabase(event.platform);
		const activeCycle = await getLatestActionCycle(database);
		const form = await event.request.formData();
		const position = Number(form.get('position'));
		const suggestionId = form.get('suggestionId');
		const title = form.get('title');
		const author = form.get('author');

		if (!activeCycle || activeCycle.status !== 'open') {
			return fail(400, { error: 'There is no open book poll.' });
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

		try {
			await saveSuggestion(
				database,
				activeCycle.id,
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

		const deleted = await deleteSuggestion(
			getBookclubDatabase(event.platform),
			suggestionId,
			member.id
		);

		if (!deleted) {
			return fail(400, { error: 'That suggestion is no longer available.' });
		}

		return { success: 'Suggestion removed.' };
	},

	closeCycle: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can close a book poll.' });
		}

		const database = getBookclubDatabase(event.platform);
		const activeCycle = await getLatestActionCycle(database);

		if (!activeCycle || activeCycle.status !== 'open') {
			return fail(400, { error: 'There is no open book poll to close.' });
		}

		try {
			await closeCycle(database, activeCycle.id);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'The book poll could not be closed.'
			});
		}

		return { success: 'The book poll is closed and ready to choose the next book.' };
	},

	scheduleMeeting: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can schedule a meeting.' });
		}

		const database = getBookclubDatabase(event.platform);
		const form = await event.request.formData();
		const scheduledFor = form.get('scheduledFor');
		const timezoneOffset = Number(form.get('timezoneOffset'));
		const note = form.get('note');

		if (
			typeof scheduledFor !== 'string' ||
			!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(scheduledFor) ||
			!Number.isInteger(timezoneOffset) ||
			Math.abs(timezoneOffset) > 840
		) {
			return fail(400, { error: 'Choose a date and time for the next meeting.' });
		}

		const localMeetingDate = new Date(`${scheduledFor}:00.000Z`);
		const meetingDate = new Date(localMeetingDate.getTime() + timezoneOffset * 60_000);
		if (!Number.isFinite(meetingDate.getTime()) || meetingDate.getTime() <= Date.now()) {
			return fail(400, { error: 'The next meeting must be in the future.' });
		}

		if (typeof note !== 'string' || note.trim().length > 160) {
			return fail(400, { error: 'Keep the meeting note under 160 characters.' });
		}

		await scheduleNextMeeting(database, member.id, meetingDate.toISOString(), note.trim() || null);
		return { success: 'The next meeting is on the calendar.' };
	},

	clearMeeting: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can clear the next meeting.' });
		}

		await clearNextMeeting(getBookclubDatabase(event.platform), member.id);
		return { success: 'The next meeting was cleared.' };
	},

	changeDisplayName: async (event) => {
		const member = await requireBookclubMember(event);
		const form = await event.request.formData();
		const displayName = form.get('displayName');

		if (
			typeof displayName !== 'string' ||
			displayName.trim().length === 0 ||
			displayName.trim().length > 24 ||
			/[\r\n]/.test(displayName)
		) {
			return fail(400, { error: 'Choose a display name between 1 and 24 characters.' });
		}

		if (
			!(await setMemberDisplayName(
				getBookclubDatabase(event.platform),
				member.id,
				displayName.trim()
			))
		) {
			return fail(400, { error: 'That is already your display name.' });
		}

		return { success: 'Display name updated.' };
	},

	changeChatColor: async (event) => {
		const member = await requireBookclubMember(event);
		const form = await event.request.formData();
		const chatColor = form.get('chatColor');

		if (typeof chatColor !== 'string' || !isValidChatColor(normalizeChatColor(chatColor))) {
			return fail(400, { error: 'Choose a valid six-digit chat color.' });
		}

		if (
			!(await setMemberChatColor(
				getBookclubDatabase(event.platform),
				member.id,
				normalizeChatColor(chatColor)
			))
		) {
			return fail(400, { error: 'That chat color is already in use.' });
		}

		return { success: 'Chat color updated.' };
	},

	sendMessage: async (event) => {
		const member = await requireBookclubMember(event);
		const form = await event.request.formData();
		const body = form.get('body');

		if (typeof body !== 'string' || body.trim().length === 0 || body.trim().length > 500) {
			return fail(400, { error: 'Messages must be between 1 and 500 characters.' });
		}

		try {
			await createChatMessage(getBookclubDatabase(event.platform), member.id, body.trim());
		} catch (error) {
			if (error instanceof ChatCooldownError) {
				return fail(429, { error: error.message });
			}

			return fail(503, { error: 'The chat is temporarily unavailable.' });
		}

		return { success: 'Message sent.' };
	},

	deleteMessage: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can moderate chat messages.' });
		}

		const form = await event.request.formData();
		const messageId = form.get('messageId');

		if (typeof messageId !== 'string' || messageId.length === 0) {
			return fail(400, { error: 'The message could not be identified.' });
		}

		if (
			!(await tombstoneChatMessageByAdmin(
				getBookclubDatabase(event.platform),
				messageId,
				member.id
			))
		) {
			return fail(400, {
				error: "Only another member's undeleted user messages can be moderated."
			});
		}

		return { success: 'Message tombstoned.' };
	},

	restoreMessage: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can restore chat messages.' });
		}

		const form = await event.request.formData();
		const messageId = form.get('messageId');

		if (typeof messageId !== 'string' || messageId.length === 0) {
			return fail(400, { error: 'The message could not be identified.' });
		}

		if (
			!(await restoreChatMessage(
				getBookclubDatabase(event.platform),
				messageId,
				member.id,
				member.role === 'admin'
			))
		) {
			return fail(400, { error: 'You cannot restore that deleted message.' });
		}

		return { success: 'Message restored.' };
	},

	deleteOwnMessage: async (event) => {
		const member = await requireBookclubMember(event);
		const form = await event.request.formData();
		const messageId = form.get('messageId');

		if (typeof messageId !== 'string' || messageId.length === 0) {
			return fail(400, { error: 'The message could not be identified.' });
		}

		if (
			!(await tombstoneOwnChatMessage(getBookclubDatabase(event.platform), messageId, member.id))
		) {
			return fail(400, { error: 'Only your own undeleted messages can be removed.' });
		}

		return { success: 'Message tombstoned.' };
	},

	draw: async (event) => {
		const member = await requireBookclubMember(event);

		if (member.role !== 'admin') {
			return fail(403, { error: 'Only the club admin can run the draw.' });
		}

		const database = getBookclubDatabase(event.platform);
		const cycle = await getLatestActionCycle(database);

		if (!cycle) {
			return fail(400, { error: 'There is no book poll ready to draw.' });
		}

		let book;
		try {
			book = await drawCycle(database, cycle.id, member.id);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'The draw could not be completed.'
			});
		}

		// A missing cover should not undo or misreport a successful server-side draw.
		try {
			const coverUrl = await findBookCover(event.fetch, book.title, book.author);
			if (coverUrl) await setBookCover(database, book.id, coverUrl);
		} catch {
			// The book remains usable without an automatically matched cover.
		}

		throw redirect(303, '/bookclub#current-book');
	}
};
