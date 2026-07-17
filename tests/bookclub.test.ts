import type {} from './env.d.ts';
import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createSession,
	findMemberByInviteCode,
	hashInviteCode
} from '../src/lib/server/bookclub/auth';
import {
	ChatCooldownError,
	createChatMessage,
	getChatMessages
} from '../src/lib/server/bookclub/chat';
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
	name: string;
	role: 'member' | 'admin';
}

async function clearDatabase(): Promise<void> {
	await database.batch([
		database.prepare('DELETE FROM bookclub_chat_messages'),
		database.prepare('DELETE FROM bookclub_meetings'),
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
		name,
		role
	};

	await database
		.prepare('INSERT INTO bookclub_members (id, name, role, invite_code_hash) VALUES (?, ?, ?, ?)')
		.bind(member.id, member.name, member.role, await hashInviteCode(code))
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

		expect(await findMemberByInviteCode(database, 'wrong-code')).toBeNull();
		expect(await findMemberByInviteCode(database, 'correct-code')).toEqual(member);
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

		await scheduleNextMeeting(database, member.id, secondMeeting, null);
		expect(await getNextMeeting(database)).toMatchObject({
			scheduledFor: secondMeeting,
			note: null
		});

		await clearNextMeeting(database);
		expect(await getNextMeeting(database)).toBeNull();
	});
});
