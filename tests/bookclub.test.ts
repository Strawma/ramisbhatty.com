import type {} from './env.d.ts';
import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createSession,
	findMemberByUsernameAndInviteCode,
	hashInviteCode
} from '../src/lib/server/bookclub/auth';
import {
	ChatCooldownError,
	createChatMessage,
	getChatMessages
} from '../src/lib/server/bookclub/chat';
import { findBookCover } from '../src/lib/server/bookclub/covers';
import {
	consumeInvitation,
	createInvitation,
	getInvitationByToken,
	revokeInvitation,
	setMemberActive,
	setMemberDisplayName
} from '../src/lib/server/bookclub/invitations';
import {
	closeCycle,
	createCycle,
	deleteSuggestion,
	drawCycle,
	getDashboard,
	saveSuggestion
} from '../src/lib/server/bookclub/cycles';
import {
	clearNextMeeting,
	getNextMeeting,
	scheduleNextMeeting
} from '../src/lib/server/bookclub/meetings';

const database = env.BOOKCLUB_DB;

interface TestMember {
	id: string;
	username: string;
	name: string;
	role: 'member' | 'admin';
}

async function clearDatabase(): Promise<void> {
	await database.batch([
		database.prepare('DELETE FROM bookclub_chat_messages'),
		database.prepare('DELETE FROM bookclub_meetings'),
		database.prepare('DELETE FROM bookclub_invitations'),
		database.prepare('DELETE FROM bookclub_reviews'),
		database.prepare('DELETE FROM bookclub_draws'),
		database.prepare('DELETE FROM bookclub_suggestions'),
		database.prepare('DELETE FROM bookclub_cycles'),
		database.prepare('DELETE FROM bookclub_books'),
		database.prepare('DELETE FROM bookclub_sessions'),
		database.prepare('DELETE FROM bookclub_members')
	]);
}

async function createTestMember(
	name: string,
	role: TestMember['role'] = 'member',
	code = `${name}-invite`
): Promise<TestMember> {
	const member = {
		id: crypto.randomUUID(),
		username: name.toLowerCase(),
		name,
		role
	};

	await database
		.prepare(
			'INSERT INTO bookclub_members (id, username, name, role, invite_code_hash) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(member.id, member.username, member.name, member.role, await hashInviteCode(code))
		.run();

	return member;
}

async function getOpenCycleId(): Promise<string> {
	const cycle = await database
		.prepare("SELECT id FROM bookclub_cycles WHERE status = 'open' LIMIT 1")
		.first<{ id: string }>();

	if (!cycle) throw new Error('Expected an open test cycle.');
	return cycle.id;
}

async function fillSuggestions(cycleId: string, members: TestMember[]): Promise<void> {
	for (const member of members) {
		for (const position of [1, 2, 3]) {
			await saveSuggestion(
				database,
				cycleId,
				member.id,
				position,
				`Book ${member.name} ${position}`,
				`Author ${position}`
			);
		}
	}
}

beforeEach(async () => {
	await clearDatabase();
});

describe('book-club authentication', () => {
	it('finds a member from a valid invite code but not an invalid one', async () => {
		const member = await createTestMember('Ramis', 'admin', 'correct-code');

		expect(await findMemberByUsernameAndInviteCode(database, 'Ramis', 'wrong-code')).toBeNull();
		expect(await findMemberByUsernameAndInviteCode(database, 'RAMIS', 'correct-code')).toEqual(
			member
		);
	});

	it('uses the username to disambiguate members with the same login code', async () => {
		const first = await createTestMember('Alex', 'member', 'shared-code');
		const second = await createTestMember('Blair', 'member', 'shared-code');

		expect(
			await findMemberByUsernameAndInviteCode(database, first.username, 'shared-code')
		).toEqual(first);
		expect(
			await findMemberByUsernameAndInviteCode(database, second.username, 'shared-code')
		).toEqual(second);
	});

	it('stores only a session token hash and creates a usable session token', async () => {
		const member = await createTestMember('Ramis');
		const token = await createSession(database, member.id);
		const session = await database
			.prepare('SELECT token_hash, expires_at FROM bookclub_sessions WHERE member_id = ?')
			.bind(member.id)
			.first<{ token_hash: string; expires_at: string }>();

		expect(token).toHaveLength(43);
		expect(session?.token_hash).not.toBe(token);
		expect(new Date(session?.expires_at ?? 0).getTime()).toBeGreaterThan(Date.now());
	});
});

describe('book-club invitations', () => {
	it('creates a one-use member invitation and consumes it into a member account', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const invitation = await createInvitation(database, admin.id, 'invite', 'alex', 'Alex');

		expect(invitation.token).not.toContain('$');
		expect(
			await database
				.prepare('SELECT token_hash FROM bookclub_invitations WHERE id = ?')
				.bind(invitation.id)
				.first<{ token_hash: string }>()
		).not.toMatchObject({ token_hash: invitation.token });
		expect(await getInvitationByToken(database, invitation.token)).toMatchObject({
			purpose: 'invite',
			display_name: 'Alex',
			username: 'alex'
		});

		await expect(
			consumeInvitation(database, invitation.token, 'a'.repeat(12))
		).resolves.toMatchObject({
			name: 'Alex',
			username: 'alex',
			role: 'member'
		});
		expect(await findMemberByUsernameAndInviteCode(database, 'alex', 'a'.repeat(12))).toMatchObject(
			{ name: 'Alex' }
		);
		expect((await getChatMessages(database, admin.id)).map((message) => message.body)).toContain(
			'NEW MEMBER: alex (Alex) joined the clubhouse.'
		);
		await expect(consumeInvitation(database, invitation.token, 'b'.repeat(12))).rejects.toThrow(
			'invalid or expired'
		);
	});

	it('replaces a previous invitation for the same username', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const first = await createInvitation(database, admin.id, 'invite', 'alex', 'Alex');

		const second = await createInvitation(database, admin.id, 'invite', 'alex', 'Another Alex');

		expect(await getInvitationByToken(database, first.token)).toBeNull();
		expect(await getInvitationByToken(database, second.token)).toMatchObject({
			username: 'alex',
			display_name: 'Another Alex'
		});
	});

	it('does not create an invitation for an existing username', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createTestMember('Alex');

		await expect(
			createInvitation(database, admin.id, 'invite', 'alex', 'New Alex')
		).rejects.toThrow('already assigned');
	});

	it('revokes invitations and replaces previous reset links', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex');
		const first = await createInvitation(database, admin.id, 'reset', member.id);
		const second = await createInvitation(database, admin.id, 'reset', member.id);

		expect(await getInvitationByToken(database, first.token)).toBeNull();
		expect(await getInvitationByToken(database, second.token)).not.toBeNull();
		expect(await revokeInvitation(database, second.id)).toBe(true);
		expect(await getInvitationByToken(database, second.token)).toBeNull();
	});

	it('resets a member code and invalidates their existing sessions', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex', 'member', 'member-code');
		await createSession(database, member.id);
		const invitation = await createInvitation(database, admin.id, 'reset', member.id);

		await consumeInvitation(database, invitation.token, 'new-member-code');
		expect(
			await database
				.prepare('SELECT COUNT(*) AS count FROM bookclub_sessions WHERE member_id = ?')
				.bind(member.id)
				.first<{ count: number }>()
		).toMatchObject({ count: 0 });
		expect(await findMemberByUsernameAndInviteCode(database, 'alex', 'member-code')).toBeNull();
		expect(
			await findMemberByUsernameAndInviteCode(database, 'alex', 'new-member-code')
		).toMatchObject({
			name: 'Alex'
		});
	});

	it('deactivates a member and clears their sessions', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex');
		await createSession(database, member.id);

		expect(await setMemberActive(database, member.id, false, admin.id)).toBe(true);
		expect(
			await database
				.prepare(
					'SELECT active, COUNT(bookclub_sessions.id) AS sessions FROM bookclub_members LEFT JOIN bookclub_sessions ON bookclub_sessions.member_id = bookclub_members.id WHERE bookclub_members.id = ?'
				)
				.bind(member.id)
				.first<{ active: number; sessions: number }>()
		).toMatchObject({ active: 0, sessions: 0 });
		expect((await getChatMessages(database, admin.id)).map((message) => message.body)).toContain(
			'MEMBER REMOVED: alex (Alex) has been deactivated.'
		);
	});

	it('announces member display-name changes', async () => {
		const member = await createTestMember('Alex');

		expect(await setMemberDisplayName(database, member.id, 'Alex Reader')).toBe(true);
		expect(
			await database
				.prepare('SELECT name FROM bookclub_members WHERE id = ?')
				.bind(member.id)
				.first<{ name: string }>()
		).toMatchObject({ name: 'Alex Reader' });
		expect((await getChatMessages(database, member.id)).map((message) => message.body)).toContain(
			'NAME CHANGE: alex is now known as Alex Reader.'
		);
	});
});

describe('book-club cover lookup', () => {
	it('turns an Open Library cover id into a display URL', async () => {
		const coverUrl = await findBookCover(
			async () =>
				new Response(JSON.stringify({ docs: [{ title: 'Dune', cover_i: 12345 }] }), {
					status: 200
				}),
			'Dune',
			'Frank Herbert'
		);

		expect(coverUrl).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
	});

	it('returns no cover when Open Library has no usable result', async () => {
		const coverUrl = await findBookCover(
			async () => new Response(JSON.stringify({ docs: [{ title: 'Unknown' }] }), { status: 200 }),
			'Unknown',
			'Nobody'
		);

		expect(coverUrl).toBeNull();
	});
});

describe('book-club cycles and suggestions', () => {
	it('enforces member-owned suggestion slots and reports progress', async () => {
		const firstMember = await createTestMember('Ramis');
		const secondMember = await createTestMember('Alex');
		await createCycle(database, 'Week 01');
		const cycleId = await getOpenCycleId();

		await saveSuggestion(database, cycleId, firstMember.id, 1, 'Dune', 'Frank Herbert');
		const dashboard = await getDashboard(database, firstMember);

		expect(dashboard.activeCycle?.id).toBe(cycleId);
		expect(dashboard.mySuggestions[0]).toMatchObject({
			position: 1,
			title: 'Dune',
			memberId: firstMember.id
		});
		expect(dashboard.suggestionProgress).toEqual([
			{ memberId: secondMember.id, memberName: 'Alex', count: 0 },
			{ memberId: firstMember.id, memberName: 'Ramis', count: 1 }
		]);

		await expect(
			saveSuggestion(
				database,
				cycleId,
				secondMember.id,
				1,
				'Changed',
				'Someone',
				dashboard.mySuggestions[0].id
			)
		).rejects.toThrow('no longer available');
		expect(await deleteSuggestion(database, dashboard.mySuggestions[0].id, secondMember.id)).toBe(
			false
		);
		expect(await deleteSuggestion(database, dashboard.mySuggestions[0].id, firstMember.id)).toBe(
			true
		);
	});

	it('locks a cycle before drawing and persists one winner', async () => {
		const members = [await createTestMember('Ramis'), await createTestMember('Alex')];
		await createCycle(database, 'Week 02');
		const cycleId = await getOpenCycleId();
		await fillSuggestions(cycleId, members);

		await closeCycle(database, cycleId);
		await expect(
			saveSuggestion(database, cycleId, members[0].id, 1, 'Too Late', 'Author')
		).rejects.toThrow('no longer open');

		await drawCycle(database, cycleId, members[0].id, false);
		expect(
			(await getChatMessages(database, members[0].id)).some((message) =>
				message.body.startsWith('CURRENT BOOK:')
			)
		).toBe(true);
		const result = await database
			.prepare(
				`SELECT c.status, c.book_id, b.title, d.suggestion_id
				 FROM bookclub_cycles AS c
				 INNER JOIN bookclub_books AS b ON b.id = c.book_id
				 INNER JOIN bookclub_draws AS d ON d.cycle_id = c.id
				 WHERE c.id = ?`
			)
			.bind(cycleId)
			.first<{ status: string; book_id: string; title: string; suggestion_id: string }>();

		expect(result).toMatchObject({ status: 'drawn' });
		expect(result?.book_id).toBeTruthy();
		expect(result?.title).toMatch(/^Book (Ramis|Alex) [123]$/);
		expect(result?.suggestion_id).toBeTruthy();
		expect((await getDashboard(database, members[0])).currentBook?.title).toBe(result?.title);
		await expect(drawCycle(database, cycleId, members[0].id, false)).rejects.toThrow(
			'no longer available'
		);
	});

	it('requires a complete suggestion pool unless the admin override is used', async () => {
		const members = [await createTestMember('Ramis'), await createTestMember('Alex')];
		await createCycle(database, 'Week 03');
		const cycleId = await getOpenCycleId();
		await saveSuggestion(database, cycleId, members[0].id, 1, 'Only Book', 'Only Author');
		await closeCycle(database, cycleId);

		await expect(drawCycle(database, cycleId, members[0].id, false)).rejects.toThrow(
			'Every active member must use all suggestion slots'
		);
		await drawCycle(database, cycleId, members[0].id, true);
	});
});

describe('book-club chat and meetings', () => {
	it('enforces the chat cooldown atomically and removes messages older than seven days', async () => {
		const member = await createTestMember('Ramis');
		await createChatMessage(database, member.id, 'Fresh message');

		await expect(createChatMessage(database, member.id, 'Too soon')).rejects.toBeInstanceOf(
			ChatCooldownError
		);

		await database
			.prepare(
				'INSERT INTO bookclub_chat_messages (id, member_id, body, created_at) VALUES (?, ?, ?, ?)'
			)
			.bind(
				crypto.randomUUID(),
				member.id,
				'Old message',
				new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
			)
			.run();

		const messages = await getChatMessages(database, member.id);
		expect(messages.map((message) => message.body)).toEqual(['Fresh message']);
	});

	it('stores one replaceable upcoming meeting', async () => {
		const member = await createTestMember('Ramis', 'admin');
		const firstMeeting = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const secondMeeting = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

		await scheduleNextMeeting(database, member.id, firstMeeting, 'Bring snacks');
		expect(await getNextMeeting(database)).toMatchObject({
			scheduledFor: firstMeeting,
			note: 'Bring snacks'
		});
		expect((await getChatMessages(database, member.id)).map((message) => message.body)).toContain(
			`MEETING UPDATED: ${firstMeeting} (Bring snacks)`
		);

		await scheduleNextMeeting(database, member.id, secondMeeting, null);
		expect(await getNextMeeting(database)).toMatchObject({
			scheduledFor: secondMeeting,
			note: null
		});

		await clearNextMeeting(database, member.id);
		expect(await getNextMeeting(database)).toBeNull();
		expect(
			(await getChatMessages(database, member.id)).some((message) =>
				message.body.startsWith('MEETING CANCELLED:')
			)
		).toBe(true);
	});
});
