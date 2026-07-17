import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	findMemberByInviteCode,
	getSessionMember,
	setBookclubSessionCookie
} from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import { verifyTurnstileToken } from '$lib/server/bookclub/turnstile';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });

	if (await getSessionMember(event)) {
		throw redirect(303, '/bookclub');
	}

	return { turnstileSiteKey: event.platform?.env.TURNSTILE_SITE_KEY ?? null };
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

		// Verify the bot challenge before reading member hashes or creating a session.
		const turnstileToken = form.get('cf-turnstile-response');
		const turnstileSecret = event.platform?.env.TURNSTILE_SECRET_KEY;

		if (typeof turnstileToken !== 'string' || !turnstileSecret) {
			return fail(503, { error: 'The club entrance is temporarily unavailable.' });
		}

		const turnstileValid = await verifyTurnstileToken(
			turnstileToken,
			turnstileSecret,
			event.getClientAddress()
		);

		if (!turnstileValid) {
			return fail(400, { error: 'Please complete the bot check and try again.' });
		}

		const database = getBookclubDatabase(event.platform);
		const member = await findMemberByInviteCode(database, inviteCode);

		if (!member) {
			return fail(400, { error: 'That invite code was not recognized.' });
		}

		const token = await createSession(database, member.id);

		setBookclubSessionCookie(event, token);

		throw redirect(303, '/bookclub');
	}
};
