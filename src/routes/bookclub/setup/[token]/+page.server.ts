import { fail, redirect } from '@sveltejs/kit';
import { createSession, setBookclubSessionCookie } from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import { consumeInvitation, getInvitationByToken } from '$lib/server/bookclub/invitations';
import type { Actions, PageServerLoad } from './$types';

function validateCode(value: FormDataEntryValue | null): value is string {
	return typeof value === 'string' && value.length >= 12 && value.length <= 256;
}

export const load: PageServerLoad = async (event) => {
	event.setHeaders({
		'cache-control': 'no-store',
		'referrer-policy': 'no-referrer'
	});

	const invitation = await getInvitationByToken(
		getBookclubDatabase(event.platform),
		event.params.token
	);

	return {
		invitation: invitation
			? {
					purpose: invitation.purpose,
					username: invitation.username,
					memberName: invitation.member_name ?? invitation.display_name
				}
			: null
	};
};

export const actions: Actions = {
	default: async (event) => {
		event.setHeaders({
			'cache-control': 'no-store',
			'referrer-policy': 'no-referrer'
		});

		const form = await event.request.formData();
		const inviteCode = form.get('inviteCode');
		const confirmation = form.get('confirmation');

		if (!validateCode(inviteCode) || !validateCode(confirmation)) {
			return fail(400, { error: 'Use a login code between 16 and 256 characters.' });
		}

		if (inviteCode !== confirmation) {
			return fail(400, { error: 'The login codes do not match.' });
		}

		try {
			const database = getBookclubDatabase(event.platform);
			const member = await consumeInvitation(database, event.params.token, inviteCode);
			const sessionToken = await createSession(database, member.id);
			setBookclubSessionCookie(event, sessionToken);
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'This setup link could not be used.'
			});
		}

		throw redirect(303, '/bookclub');
	}
};
