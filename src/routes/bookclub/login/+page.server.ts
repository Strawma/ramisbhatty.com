import { fail, redirect } from '@sveltejs/kit';
import {
	BOOKCLUB_SESSION_COOKIE,
	createSession,
	findMemberByInviteCode,
	getSessionMember
} from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });

	if (await getSessionMember(event)) {
		throw redirect(303, '/bookclub');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const inviteCode = form.get('inviteCode');

		if (
			typeof inviteCode !== 'string' ||
			inviteCode.trim().length === 0 ||
			inviteCode.length > 256
		) {
			return fail(400, { error: 'Enter your invite code.' });
		}

		const database = getBookclubDatabase(event.platform);
		const member = await findMemberByInviteCode(database, inviteCode.trim());

		if (!member) {
			return fail(400, { error: 'That invite code was not recognized.' });
		}

		const token = await createSession(database, member.id);

		event.cookies.set(BOOKCLUB_SESSION_COOKIE, token, {
			httpOnly: true,
			secure: event.url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 14,
			path: '/bookclub'
		});

		throw redirect(303, '/bookclub');
	}
};
