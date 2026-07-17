import type { D1Database } from '@cloudflare/workers-types';
import { hashInviteCode, invalidateMemberSessions, normalizeUsername } from './auth';
import { prepareChatAnnouncement } from './chat';
import type { BookclubMember } from './db';

const INVITATION_LIFETIME_MS = 48 * 60 * 60 * 1000;

export type InvitationPurpose = 'invite' | 'reset';

export interface BookclubInvitation {
	id: string;
	purpose: InvitationPurpose;
	memberId: string | null;
	memberName: string | null;
	displayName: string | null;
	username: string | null;
	createdByName: string;
	expiresAt: string;
	consumedAt: string | null;
	revokedAt: string | null;
	createdAt: string;
}

export interface CreatedInvitation {
	id: string;
	token: string;
	expiresAt: string;
}

interface InvitationRow {
	id: string;
	purpose: InvitationPurpose;
	member_id: string | null;
	member_name: string | null;
	display_name: string | null;
	username: string | null;
	created_by_name: string;
	expires_at: string;
	consumed_at: string | null;
	revoked_at: string | null;
	created_at: string;
}

interface SetupInvitationRow {
	id: string;
	purpose: InvitationPurpose;
	member_id: string | null;
	member_name: string | null;
	display_name: string | null;
	username: string | null;
	expires_at: string;
}

interface ActiveInvitationRow extends SetupInvitationRow {
	token_hash: string;
}

interface MemberRow extends BookclubMember {
	active: number;
	username: string;
	created_at: string;
}

export interface BookclubMemberSummary extends BookclubMember {
	active: boolean;
	createdAt: string;
}

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';

	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return encodeBase64Url(new Uint8Array(digest));
}

function toInvitation(row: InvitationRow): BookclubInvitation {
	return {
		id: row.id,
		purpose: row.purpose,
		memberId: row.member_id,
		memberName: row.member_name,
		displayName: row.display_name,
		username: row.username,
		createdByName: row.created_by_name,
		expiresAt: row.expires_at,
		consumedAt: row.consumed_at,
		revokedAt: row.revoked_at,
		createdAt: row.created_at
	};
}

function invitationExpiry(): string {
	return new Date(Date.now() + INVITATION_LIFETIME_MS).toISOString();
}

export async function createInvitation(
	database: D1Database,
	createdByMemberId: string,
	purpose: 'invite',
	username: string,
	displayName: string
): Promise<CreatedInvitation>;
export async function createInvitation(
	database: D1Database,
	createdByMemberId: string,
	purpose: 'reset',
	memberId: string
): Promise<CreatedInvitation>;
export async function createInvitation(
	database: D1Database,
	createdByMemberId: string,
	purpose: InvitationPurpose,
	value: string,
	displayName?: string
): Promise<CreatedInvitation> {
	const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
	const id = crypto.randomUUID();
	const expiresAt = invitationExpiry();
	const tokenHash = await hashToken(token);
	const normalizedValue = normalizeUsername(value);

	const revokePrevious =
		purpose === 'reset'
			? database
					.prepare(
						`UPDATE bookclub_invitations
						 SET revoked_at = COALESCE(revoked_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
						 WHERE purpose = 'reset' AND member_id = ?
						   AND consumed_at IS NULL AND revoked_at IS NULL`
					)
					.bind(value)
			: database.prepare('SELECT 1');

	const insert =
		purpose === 'invite'
			? database
					.prepare(
						`INSERT INTO bookclub_invitations
						 (id, purpose, token_hash, username, display_name, created_by_member_id, expires_at)
						 VALUES (?, 'invite', ?, ?, ?, ?, ?)`
					)
					.bind(id, tokenHash, normalizedValue, displayName, createdByMemberId, expiresAt)
			: database
					.prepare(
						`INSERT INTO bookclub_invitations
						 (id, purpose, token_hash, member_id, created_by_member_id, expires_at)
						 VALUES (?, 'reset', ?, ?, ?, ?)`
					)
					.bind(id, tokenHash, value, createdByMemberId, expiresAt);

	await database.batch([revokePrevious, insert]);

	return { id, token, expiresAt };
}

export async function getInvitationByToken(
	database: D1Database,
	token: string
): Promise<SetupInvitationRow | null> {
	const tokenHash = await hashToken(token);
	return database
		.prepare(
			`SELECT i.id, i.purpose, i.member_id, m.name AS member_name, i.display_name,
			        COALESCE(i.username, m.username) AS username, i.expires_at
			 FROM bookclub_invitations AS i
			 LEFT JOIN bookclub_members AS m ON m.id = i.member_id
			 WHERE i.token_hash = ?
			   AND i.consumed_at IS NULL
			   AND i.revoked_at IS NULL
			   AND i.expires_at > ?
			 LIMIT 1`
		)
		.bind(tokenHash, new Date().toISOString())
		.first<SetupInvitationRow>();
}

export async function getInvitationSummaries(database: D1Database): Promise<BookclubInvitation[]> {
	const result = await database
		.prepare(
			`SELECT i.id, i.purpose, i.member_id, m.name AS member_name, i.display_name,
			        COALESCE(i.username, m.username) AS username,
			        creator.name AS created_by_name, i.expires_at, i.consumed_at, i.revoked_at, i.created_at
			 FROM bookclub_invitations AS i
			 INNER JOIN bookclub_members AS creator ON creator.id = i.created_by_member_id
			 LEFT JOIN bookclub_members AS m ON m.id = i.member_id
			 ORDER BY i.created_at DESC
			 LIMIT 50`
		)
		.all<InvitationRow>();

	return result.results.map(toInvitation);
}

export async function getMemberSummaries(database: D1Database): Promise<BookclubMemberSummary[]> {
	const result = await database
		.prepare(
			'SELECT id, username, name, role, active, created_at FROM bookclub_members ORDER BY created_at, name'
		)
		.all<MemberRow>();

	return result.results.map((member) => ({
		id: member.id,
		username: member.username,
		name: member.name,
		role: member.role,
		active: Boolean(member.active),
		createdAt: member.created_at
	}));
}

export async function revokeInvitation(
	database: D1Database,
	invitationId: string
): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_invitations
			 SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL`
		)
		.bind(invitationId)
		.run();

	return Boolean(result.meta.changes);
}

export async function consumeInvitation(
	database: D1Database,
	token: string,
	inviteCode: string
): Promise<BookclubMember> {
	const tokenHash = await hashToken(token);
	const invitation = await database
		.prepare(
			`SELECT i.id, i.purpose, i.token_hash, i.member_id, m.name AS member_name,
			        i.display_name, COALESCE(i.username, m.username) AS username, i.expires_at
			 FROM bookclub_invitations AS i
			 LEFT JOIN bookclub_members AS m ON m.id = i.member_id
			 WHERE i.token_hash = ?
			   AND i.consumed_at IS NULL
			   AND i.revoked_at IS NULL
			   AND i.expires_at > ?
			 LIMIT 1`
		)
		.bind(tokenHash, new Date().toISOString())
		.first<ActiveInvitationRow>();

	if (!invitation) throw new Error('This setup link is invalid or expired.');

	const inviteCodeHash = await hashInviteCode(inviteCode);
	const now = new Date().toISOString();

	if (invitation.purpose === 'invite') {
		const memberId = invitation.id;
		const results = await database.batch([
			database
				.prepare(
					`INSERT INTO bookclub_members (id, username, name, invite_code_hash, role)
					 SELECT ?, username, display_name, ?, 'member'
					 FROM bookclub_invitations
					 WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?`
				)
				.bind(memberId, inviteCodeHash, invitation.id, now),
			prepareChatAnnouncement(
				database,
				memberId,
				`NEW MEMBER: ${invitation.username ?? 'new member'} (${invitation.display_name ?? 'member'}) joined the clubhouse.`
			),
			database
				.prepare(
					`UPDATE bookclub_invitations SET consumed_at = ?
					 WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?`
				)
				.bind(now, invitation.id, now)
		]);

		if (!results[0].meta.changes) throw new Error('This setup link is invalid or expired.');

		return {
			id: memberId,
			username: invitation.username ?? 'member',
			name: invitation.display_name ?? 'Book club member',
			role: 'member'
		};
	}

	if (!invitation.member_id) throw new Error('This setup link is invalid or expired.');

	const results = await database.batch([
		database
			.prepare(
				`UPDATE bookclub_members
				 SET invite_code_hash = ?
				 WHERE id = ? AND EXISTS (
					 SELECT 1 FROM bookclub_invitations
					 WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?
				 )`
			)
			.bind(inviteCodeHash, invitation.member_id, invitation.id, now),
		database
			.prepare('DELETE FROM bookclub_sessions WHERE member_id = ?')
			.bind(invitation.member_id),
		database
			.prepare(
				`UPDATE bookclub_invitations SET consumed_at = ?
				 WHERE id = ? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?`
			)
			.bind(now, invitation.id, now)
	]);

	if (!results[0].meta.changes) throw new Error('This setup link is invalid or expired.');

	return {
		id: invitation.member_id,
		username: invitation.username ?? 'member',
		name: invitation.member_name ?? 'Book club member',
		role: 'member'
	};
}

export async function setMemberActive(
	database: D1Database,
	memberId: string,
	active: boolean,
	actorMemberId?: string
): Promise<boolean> {
	const target = await database
		.prepare('SELECT username, name, active FROM bookclub_members WHERE id = ? LIMIT 1')
		.bind(memberId)
		.first<{ username: string; name: string; active: number }>();

	if (!target || Boolean(target.active) === active) return false;

	await database.batch([
		database
			.prepare('UPDATE bookclub_members SET active = ? WHERE id = ?')
			.bind(active ? 1 : 0, memberId),
		...(actorMemberId
			? [
					prepareChatAnnouncement(
						database,
						actorMemberId,
						active
							? `MEMBER REACTIVATED: ${target.username} (${target.name}) is back in the clubhouse.`
							: `MEMBER REMOVED: ${target.username} (${target.name}) has been deactivated.`
					)
				]
			: [])
	]);

	if (!active) await invalidateMemberSessions(database, memberId);

	return true;
}

export async function setMemberUsername(
	database: D1Database,
	memberId: string,
	username: string
): Promise<boolean> {
	const result = await database
		.prepare('UPDATE bookclub_members SET username = ? WHERE id = ?')
		.bind(normalizeUsername(username), memberId)
		.run();

	return Boolean(result.meta.changes);
}

export async function setMemberDisplayName(
	database: D1Database,
	memberId: string,
	displayName: string
): Promise<boolean> {
	const member = await database
		.prepare('SELECT name, username FROM bookclub_members WHERE id = ? LIMIT 1')
		.bind(memberId)
		.first<{ name: string; username: string }>();

	if (!member || member.name === displayName) return false;

	await database.batch([
		database
			.prepare('UPDATE bookclub_members SET name = ? WHERE id = ?')
			.bind(displayName, memberId),
		prepareChatAnnouncement(
			database,
			memberId,
			`NAME CHANGE: ${member.username} is now known as ${displayName}.`
		)
	]);

	return true;
}
