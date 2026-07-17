import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import {
	invalidateMemberSessions,
	isValidUsername,
	normalizeUsername,
	requireBookclubMember
} from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import {
	createInvitation,
	getInvitationSummaries,
	getMemberSummaries,
	revokeInvitation,
	setMemberActive,
	setMemberUsername
} from '$lib/server/bookclub/invitations';
import type { Actions, PageServerLoad } from './$types';

async function requireAdmin(event: RequestEvent) {
	event.setHeaders({
		'cache-control': 'no-store',
		'referrer-policy': 'no-referrer'
	});
	const member = await requireBookclubMember(event);

	if (member.role !== 'admin') throw redirect(303, '/bookclub');

	return member;
}

export const load: PageServerLoad = async (event) => {
	const member = await requireAdmin(event);
	const database = getBookclubDatabase(event.platform);

	return {
		member,
		members: await getMemberSummaries(database),
		invitations: await getInvitationSummaries(database)
	};
};

export const actions: Actions = {
	createInvitation: async (event) => {
		const member = await requireAdmin(event);
		const form = await event.request.formData();
		const username = form.get('username');
		const displayName = form.get('displayName');

		if (
			typeof username !== 'string' ||
			!isValidUsername(normalizeUsername(username)) ||
			typeof displayName !== 'string' ||
			displayName.trim().length === 0 ||
			displayName.trim().length > 24 ||
			/[\r\n]/.test(displayName)
		) {
			return fail(400, {
				error:
					'Use a unique username of 3-32 letters, numbers, dots, dashes, or underscores, plus a display name under 24 single-line characters.'
			});
		}

		let invitation;
		try {
			invitation = await createInvitation(
				getBookclubDatabase(event.platform),
				member.id,
				'invite',
				normalizeUsername(username),
				displayName.trim()
			);
		} catch {
			return fail(400, { error: 'That username is already assigned or has a pending invitation.' });
		}

		return {
			success: 'Invitation created. Send the private setup link to the member.',
			invitationUrl: new URL(`/bookclub/setup/${invitation.token}`, event.url).toString()
		};
	},

	resetInvite: async (event) => {
		const member = await requireAdmin(event);
		const form = await event.request.formData();
		const memberId = form.get('memberId');

		if (typeof memberId !== 'string' || memberId.length === 0) {
			return fail(400, { error: 'Choose a member whose login code should be reset.' });
		}

		const database = getBookclubDatabase(event.platform);
		let invitation;
		try {
			invitation = await createInvitation(database, member.id, 'reset', memberId);
		} catch {
			return fail(404, { error: 'That member no longer exists.' });
		}
		return {
			success: 'Reset link created. Send it privately to the member.',
			invitationUrl: new URL(`/bookclub/setup/${invitation.token}`, event.url).toString()
		};
	},

	revokeInvitation: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const invitationId = form.get('invitationId');

		if (typeof invitationId !== 'string' || invitationId.length === 0) {
			return fail(400, { error: 'The invitation could not be identified.' });
		}

		if (!(await revokeInvitation(getBookclubDatabase(event.platform), invitationId))) {
			return fail(400, { error: 'That invitation is no longer active.' });
		}

		return { success: 'Invitation revoked.' };
	},

	setMemberActive: async (event) => {
		const member = await requireAdmin(event);
		const form = await event.request.formData();
		const memberId = form.get('memberId');
		const active = form.get('active') === 'true';

		if (typeof memberId !== 'string' || memberId.length === 0) {
			return fail(400, { error: 'The member could not be identified.' });
		}

		if (memberId === member.id && !active) {
			return fail(400, { error: 'You cannot deactivate your own admin account.' });
		}

		const database = getBookclubDatabase(event.platform);
		const target = await database
			.prepare('SELECT id, username, name, role, active FROM bookclub_members WHERE id = ? LIMIT 1')
			.bind(memberId)
			.first<{
				id: string;
				username: string;
				name: string;
				role: 'member' | 'admin';
				active: number;
			}>();

		if (!target) return fail(404, { error: 'That member no longer exists.' });

		if (!active && target.role === 'admin' && target.active) {
			const admins = await database
				.prepare(
					"SELECT COUNT(*) AS count FROM bookclub_members WHERE role = 'admin' AND active = 1"
				)
				.first<{ count: number }>();

			if ((admins?.count ?? 0) <= 1) {
				return fail(400, { error: 'The club must keep at least one active administrator.' });
			}
		}

		if (
			!(await setMemberActive(database, memberId, active, member.id, {
				username: target.username,
				name: target.name,
				active: target.active
			}))
		) {
			return fail(400, { error: 'That member status did not change.' });
		}

		return { success: active ? 'Member reactivated.' : 'Member deactivated.' };
	},

	setUsername: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const memberId = form.get('memberId');
		const username = form.get('username');

		if (
			typeof memberId !== 'string' ||
			memberId.length === 0 ||
			typeof username !== 'string' ||
			!isValidUsername(normalizeUsername(username))
		) {
			return fail(400, {
				error: 'Use a username of 3-32 letters, numbers, dots, dashes, or underscores.'
			});
		}

		try {
			if (!(await setMemberUsername(getBookclubDatabase(event.platform), memberId, username))) {
				return fail(404, { error: 'That member no longer exists.' });
			}
		} catch {
			return fail(400, { error: 'That username is already assigned.' });
		}

		return { success: 'Username updated.' };
	},

	logoutAll: async (event) => {
		await requireAdmin(event);
		const form = await event.request.formData();
		const memberId = form.get('memberId');

		if (typeof memberId !== 'string' || memberId.length === 0) {
			return fail(400, { error: 'The member could not be identified.' });
		}

		await invalidateMemberSessions(getBookclubDatabase(event.platform), memberId);
		return { success: 'All sessions for that member were invalidated.' };
	}
};
