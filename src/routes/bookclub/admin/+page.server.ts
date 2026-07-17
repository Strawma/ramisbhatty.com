import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { requireBookclubMember, invalidateMemberSessions } from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import {
	createInvitation,
	getInvitationSummaries,
	getMemberSummaries,
	revokeInvitation,
	setMemberActive
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
		const displayName = form.get('displayName');

		if (
			typeof displayName !== 'string' ||
			displayName.trim().length === 0 ||
			displayName.trim().length > 80
		) {
			return fail(400, { error: 'Give the new member a display name under 80 characters.' });
		}

		const invitation = await createInvitation(
			getBookclubDatabase(event.platform),
			member.id,
			'invite',
			displayName.trim()
		);

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
		const target = await database
			.prepare('SELECT id FROM bookclub_members WHERE id = ? LIMIT 1')
			.bind(memberId)
			.first<{ id: string }>();

		if (!target) return fail(404, { error: 'That member no longer exists.' });

		const invitation = await createInvitation(database, member.id, 'reset', memberId);
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
			.prepare('SELECT id, role, active FROM bookclub_members WHERE id = ? LIMIT 1')
			.bind(memberId)
			.first<{ id: string; role: 'member' | 'admin'; active: number }>();

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

		if (!(await setMemberActive(database, memberId, active))) {
			return fail(400, { error: 'That member status did not change.' });
		}

		return { success: active ? 'Member reactivated.' : 'Member deactivated.' };
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
