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
	getChatMembers,
	getChatMessages,
	restoreChatMessage,
	tombstoneChatMessageByAdmin,
	tombstoneOwnChatMessage
} from '../src/lib/server/bookclub/chat';
import { cleanupBookclubData } from '../src/lib/server/bookclub/maintenance';
import { findBookCover } from '../src/lib/server/bookclub/covers';
import {
	consumeInvitation,
	createInvitation,
	getInvitationByToken,
	revokeInvitation,
	setMemberActive,
	setMemberChatColor,
	setMemberDisplayName
} from '../src/lib/server/bookclub/invitations';
import {
	advanceBook,
	closeCycle,
	createCycle,
	deleteBookPoll,
	deleteSuggestion,
	drawCycle,
	rerollCycle,
	reopenCycle,
	getArchive,
	getDashboard,
	getBookPollSummaries,
	getDrawReplay,
	saveSuggestion
} from '../src/lib/server/bookclub/cycles';
import {
	clearNextMeeting,
	getNextMeeting,
	scheduleNextMeeting
} from '../src/lib/server/bookclub/meetings';
import {
	deleteOwnBookReview,
	getBookReviews,
	saveBookReview
} from '../src/lib/server/bookclub/reviews';

const database = env.BOOKCLUB_DB;

interface TestMember {
	id: string;
	username: string;
	name: string;
	role: 'member' | 'admin';
	chatColor: string;
}

async function clearDatabase(): Promise<void> {
	await database.batch([
		database.prepare('DELETE FROM bookclub_chat_messages'),
		database.prepare('DELETE FROM bookclub_meetings'),
		database.prepare('DELETE FROM bookclub_invitations'),
		database.prepare('DELETE FROM bookclub_reviews'),
		database.prepare('DELETE FROM bookclub_rerolls'),
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
		role,
		chatColor: '#22d3ee'
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

async function drawAfterClosing(cycleId: string, memberId: string) {
	await closeCycle(database, cycleId);
	return drawCycle(database, cycleId, memberId);
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
			role: 'member',
			chatColor: '#f472b6'
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

	it('assigns unused colors to new members and rejects duplicate custom colors', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const invitation = await createInvitation(database, admin.id, 'invite', 'alex', 'Alex');
		const member = await consumeInvitation(database, invitation.token, 'a'.repeat(12));

		expect(member.chatColor).toBe('#f472b6');
		expect(await setMemberChatColor(database, member.id, '#ff66cc')).toBe(true);
		expect(await setMemberChatColor(database, admin.id, '#ff66cc')).toBe(false);
		expect(await setMemberChatColor(database, admin.id, '#123abc')).toBe(true);
		expect(
			await database
				.prepare('SELECT chat_color FROM bookclub_members WHERE id = ?')
				.bind(admin.id)
				.first<{ chat_color: string }>()
		).toMatchObject({ chat_color: '#123abc' });
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
	it('excludes a winner for two draws, preserves editable carryover, and restores eligibility on the third', async () => {
		const members = await Promise.all(
			['Ramis', 'Alex', 'Blair'].map((name) => createTestMember(name))
		);
		await createCycle(database);
		const first = await getOpenCycleId();
		await saveSuggestion(database, first, members[0].id, 1, 'Dune', 'Frank Herbert');
		await closeCycle(database, first);
		await drawCycle(database, first, members[0].id);
		await advanceBook(database, first, members[0].id);
		const savedReplay = await getDrawReplay(database, first);
		await createCycle(database);
		const second = await getOpenCycleId();
		await saveSuggestion(database, second, members[0].id, 1, 'Beloved', 'Toni Morrison');
		await closeCycle(database, second);
		await expect(drawCycle(database, second, members[0].id)).rejects.toThrow(
			'No eligible suggestions'
		);
		expect(await reopenCycle(database, second)).toBe(true);
		await saveSuggestion(database, second, members[1].id, 1, 'Piranesi', 'Susanna Clarke');
		await closeCycle(database, second);
		expect(await drawCycle(database, second, members[0].id)).toMatchObject({ title: 'Piranesi' });
		expect((await getDrawReplay(database, second))?.suggestions).toMatchObject([
			{ memberId: members[1].id }
		]);
		await advanceBook(database, second, members[0].id);
		await createCycle(database);
		const third = await getOpenCycleId();
		const dashboard = await getDashboard(database, members[0]);
		expect(dashboard.mySuggestions).toMatchObject([{ title: 'Beloved' }]);
		expect(
			dashboard.suggestionProgress.find((row) => row.memberId === members[0].id)?.cooldownDraws
		).toBe(1);
		await saveSuggestion(database, third, members[2].id, 1, 'Frankenstein', 'Mary Shelley');
		await closeCycle(database, third);
		expect(await drawCycle(database, third, members[0].id)).toMatchObject({
			title: 'Frankenstein'
		});
		await advanceBook(database, third, members[0].id);
		await createCycle(database);
		const fourth = await getOpenCycleId();
		expect(
			(await getDashboard(database, members[0])).suggestionProgress.find(
				(row) => row.memberId === members[0].id
			)?.cooldownDraws
		).toBe(0);
		await closeCycle(database, fourth);
		expect(await drawCycle(database, fourth, members[0].id)).toMatchObject({ title: 'Beloved' });
		expect(await getDrawReplay(database, first)).toMatchObject({
			drawId: savedReplay!.drawId,
			winnerSuggestionId: savedReplay!.winnerSuggestionId,
			suggestions: savedReplay!.suggestions
		});
	});

	it('rerolls only upcoming books, records reasons, excludes rejected books, and cools down only the final winner', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const members = [admin, await createTestMember('Alex'), await createTestMember('Blair')];
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		for (const [index, member] of members.entries()) {
			await saveSuggestion(
				database,
				cycleId,
				member.id,
				1,
				['Dune', 'Piranesi', 'Beloved'][index],
				`Author ${index}`
			);
		}
		const original = await drawAfterClosing(cycleId, admin.id);
		const replay = (await getDrawReplay(database, cycleId))!;
		await expect(
			rerollCycle(database, cycleId, replay.drawId, members[1].id, 'Unavailable')
		).rejects.toThrow('Only the club admin');
		await expect(rerollCycle(database, cycleId, replay.drawId, admin.id, '  ')).rejects.toThrow(
			'Enter a reason'
		);
		await expect(
			rerollCycle(database, cycleId, replay.drawId, admin.id, 'x'.repeat(301))
		).rejects.toThrow('Enter a reason');
		const replacement = await rerollCycle(
			database,
			cycleId,
			replay.drawId,
			admin.id,
			'No copies available'
		);
		expect(replacement.title).not.toBe(original.title);
		const updated = (await getDrawReplay(database, cycleId))!;
		expect(updated.drawId).not.toBe(replay.drawId);
		expect(updated.suggestions).toHaveLength(2);
		expect(updated.rerolls).toMatchObject([
			{ previousTitle: original.title, reason: 'No copies available', memberName: 'Ramis' }
		]);
		const progress = (await getDashboard(database, admin)).suggestionProgress;
		const originalMember = replay.suggestions.find(
			(row) => row.id === replay.winnerSuggestionId
		)!.memberId;
		const replacementMember = updated.suggestions.find(
			(row) => row.id === updated.winnerSuggestionId
		)!.memberId;
		expect(progress.find((row) => row.memberId === originalMember)?.cooldownDraws).toBe(0);
		expect(progress.find((row) => row.memberId === replacementMember)?.cooldownDraws).toBe(2);
		expect(await advanceBook(database, cycleId, admin.id, original.id)).toBe(false);
		await expect(rerollCycle(database, cycleId, replay.drawId, admin.id, 'Stale')).rejects.toThrow(
			'no longer waiting'
		);
		const third = await rerollCycle(
			database,
			cycleId,
			updated.drawId,
			admin.id,
			'Also unavailable'
		);
		expect([original.title, replacement.title]).not.toContain(third.title);
		const final = (await getDrawReplay(database, cycleId))!;
		await expect(rerollCycle(database, cycleId, final.drawId, admin.id, 'No more')).rejects.toThrow(
			'No eligible alternatives'
		);
		expect(await getDrawReplay(database, cycleId)).toEqual(final);
		expect(await advanceBook(database, cycleId, admin.id, third.id)).toBe(true);
		await expect(
			rerollCycle(database, cycleId, final.drawId, admin.id, 'Too late')
		).rejects.toThrow('no longer waiting');
		expect(await deleteBookPoll(database, cycleId)).toBe(true);
		expect(
			await database.prepare('SELECT COUNT(*) AS count FROM bookclub_rerolls').first()
		).toEqual({ count: 0 });
	});

	it('allows one concurrent reroll and rejects a stale start after replacement', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await fillSuggestions(cycleId, [admin]);
		const original = await drawAfterClosing(cycleId, admin.id);
		const replay = (await getDrawReplay(database, cycleId))!;
		const results = await Promise.allSettled([
			rerollCycle(database, cycleId, replay.drawId, admin.id, 'Unavailable'),
			rerollCycle(database, cycleId, replay.drawId, admin.id, 'Unavailable')
		]);
		expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
		expect((await getDrawReplay(database, cycleId))?.rerolls).toHaveLength(1);
		expect(
			(await getChatMessages(database, admin.id)).filter((row) =>
				row.body.startsWith('BOOK REROLL:')
			)
		).toHaveLength(1);
		expect(await advanceBook(database, cycleId, admin.id, original.id)).toBe(false);
		expect(await database.prepare('SELECT COUNT(*) AS count FROM bookclub_books').first()).toEqual({
			count: 1
		});
	});

	it('rolls back the entire reroll if its announcement cannot be saved', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await fillSuggestions(cycleId, [admin]);
		await drawAfterClosing(cycleId, admin.id);
		const replay = (await getDrawReplay(database, cycleId))!;
		await database
			.prepare(
				`CREATE TRIGGER fail_reroll BEFORE INSERT ON bookclub_chat_messages
			WHEN NEW.body LIKE 'BOOK REROLL:%' BEGIN SELECT RAISE(ABORT, 'test failure'); END`
			)
			.run();
		try {
			await expect(
				rerollCycle(database, cycleId, replay.drawId, admin.id, 'Unavailable')
			).rejects.toThrow();
			expect(await getDrawReplay(database, cycleId)).toEqual(replay);
		} finally {
			await database.prepare('DROP TRIGGER fail_reroll').run();
		}
	});

	it('allows either a competing start or reroll to claim the displayed book', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await fillSuggestions(cycleId, [admin]);
		const original = await drawAfterClosing(cycleId, admin.id);
		const replay = (await getDrawReplay(database, cycleId))!;
		const [reroll, start] = await Promise.allSettled([
			rerollCycle(database, cycleId, replay.drawId, admin.id, 'Unavailable'),
			advanceBook(database, cycleId, admin.id, original.id)
		]);
		expect(start.status).toBe('fulfilled');
		const started = start.status === 'fulfilled' && start.value;
		expect(Number(reroll.status === 'fulfilled') + Number(started)).toBe(1);
		const dashboard = await getDashboard(database, admin);
		expect(Boolean(dashboard.currentBook)).toBe(started);
		expect(Boolean(dashboard.upcomingCycle)).toBe(!started);
		expect((await getDrawReplay(database, cycleId))?.rerolls).toHaveLength(started ? 0 : 1);
	});

	it('accepts maximum-length titles, authors, and reasons without overflowing chat', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await saveSuggestion(database, cycleId, admin.id, 1, 'A'.repeat(200), 'C'.repeat(120));
		await saveSuggestion(database, cycleId, admin.id, 2, 'B'.repeat(200), 'D'.repeat(120));
		await drawAfterClosing(cycleId, admin.id);
		const replay = (await getDrawReplay(database, cycleId))!;
		await rerollCycle(database, cycleId, replay.drawId, admin.id, 'R'.repeat(300));
		expect((await getDrawReplay(database, cycleId))?.rerolls[0].reason).toHaveLength(300);
	});
	it('keeps a draw upcoming until an explicit start, then archives only when the next book starts', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const alex = await createTestMember('Alex');
		const blair = await createTestMember('Blair');
		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(database, firstCycleId, admin.id, 1, 'Piranesi', 'Susanna Clarke');
		await closeCycle(database, firstCycleId);
		const firstBook = await drawCycle(database, firstCycleId, admin.id);
		expect(firstBook.startedAt).toBeNull();
		expect(await getDashboard(database, admin)).toMatchObject({
			currentBook: null,
			upcomingCycle: { id: firstCycleId, book: { id: firstBook.id, startedAt: null } },
			archive: []
		});
		expect((await getChatMessages(database, admin.id)).map((message) => message.body)).toEqual([
			'UPCOMING BOOK: Piranesi by Susanna Clarke. Time to find a copy!'
		]);
		expect((await getDrawReplay(database, firstCycleId))?.book.startedAt).toBeNull();
		await expect(
			saveBookReview(database, firstBook.id, admin.id, {
				rating: 4,
				body: 'Too early',
				favouriteQuote: '',
				spoiler: false,
				verdict: ''
			})
		).rejects.toThrow('completed archived books');

		expect(await advanceBook(database, firstCycleId, admin.id)).toBe(true);
		const current = (await getDashboard(database, admin)).currentBook;
		expect(current).toMatchObject({
			id: firstBook.id,
			startedAt: expect.any(String),
			completedAt: null
		});

		await createCycle(database);
		const secondCycleId = await getOpenCycleId();
		await saveSuggestion(database, secondCycleId, alex.id, 1, 'Dune', 'Frank Herbert');
		await closeCycle(database, secondCycleId);
		const secondBook = await drawCycle(database, secondCycleId, admin.id);
		expect(await getDashboard(database, admin)).toMatchObject({
			currentBook: current,
			upcomingCycle: { id: secondCycleId, book: { id: secondBook.id, startedAt: null } },
			archive: []
		});
		expect(await advanceBook(database, firstCycleId, admin.id)).toBe(false);
		expect(await advanceBook(database, 'missing-cycle', admin.id)).toBe(false);
		expect((await getDashboard(database, admin)).currentBook).toEqual(current);
		await expect(
			saveBookReview(database, firstBook.id, admin.id, {
				rating: 4,
				body: 'Still reading',
				favouriteQuote: '',
				spoiler: false,
				verdict: ''
			})
		).rejects.toThrow('completed archived books');

		// Collecting suggestions can continue, but there is only one reserved book.
		await createCycle(database);
		const thirdCycleId = await getOpenCycleId();
		await saveSuggestion(database, thirdCycleId, blair.id, 1, 'Beloved', 'Toni Morrison');
		await expect(
			saveSuggestion(database, thirdCycleId, admin.id, 2, 'Dune', 'Frank Herbert')
		).rejects.toThrow('already selected');
		await closeCycle(database, thirdCycleId);
		await expect(drawCycle(database, thirdCycleId, admin.id)).rejects.toThrow(
			'Start the upcoming book'
		);
		await expect(advanceBook(database, secondCycleId, 'missing-member')).rejects.toThrow();
		expect((await getDashboard(database, admin)).currentBook).toEqual(current);
		expect(await advanceBook(database, secondCycleId, admin.id)).toBe(true);
		const dashboard = await getDashboard(database, admin);
		expect(dashboard.upcomingCycle).toBeNull();
		expect(dashboard.currentBook).toMatchObject({
			id: secondBook.id,
			startedAt: expect.any(String),
			completedAt: null
		});
		expect(dashboard.archive).toMatchObject([
			{ id: firstCycleId, book: { completedAt: dashboard.currentBook?.startedAt } }
		]);
		await expect(
			saveBookReview(database, firstBook.id, admin.id, {
				rating: 4,
				body: 'Finished',
				favouriteQuote: '',
				spoiler: false,
				verdict: ''
			})
		).resolves.toBeUndefined();
		await expect(drawCycle(database, thirdCycleId, admin.id)).resolves.toMatchObject({
			title: 'Beloved',
			startedAt: null
		});
	});

	it('persists one draw and one start announcement under concurrent submissions', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await saveSuggestion(database, cycleId, admin.id, 1, 'Dune', 'Frank Herbert');
		await closeCycle(database, cycleId);
		const draws = await Promise.allSettled([
			drawCycle(database, cycleId, admin.id),
			drawCycle(database, cycleId, admin.id)
		]);
		expect(draws.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		expect(await database.prepare('SELECT COUNT(*) AS count FROM bookclub_books').first()).toEqual({
			count: 1
		});
		const starts = await Promise.all([
			advanceBook(database, cycleId, admin.id),
			advanceBook(database, cycleId, admin.id)
		]);
		expect(starts.sort()).toEqual([false, true]);
		const messages = await getChatMessages(database, admin.id);
		expect(messages.filter((message) => message.body.startsWith('UPCOMING BOOK:'))).toHaveLength(1);
		expect(messages.filter((message) => message.body.startsWith('CURRENT BOOK:'))).toHaveLength(1);
		expect((await getDashboard(database, admin)).currentBook?.completedAt).toBeNull();
	});

	it('allows only one upcoming winner across concurrent draws from different closed polls', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const cycleIds: string[] = [];
		for (const title of ['Piranesi', 'Dune']) {
			await createCycle(database);
			const cycleId = await getOpenCycleId();
			cycleIds.push(cycleId);
			await saveSuggestion(database, cycleId, admin.id, 1, title, 'An Author');
			await closeCycle(database, cycleId);
		}
		const draws = await Promise.allSettled(cycleIds.map((id) => drawCycle(database, id, admin.id)));
		expect(draws.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		expect(await database.prepare('SELECT COUNT(*) AS count FROM bookclub_books').first()).toEqual({
			count: 1
		});
		expect(
			await database
				.prepare(
					"SELECT COUNT(*) AS count FROM bookclub_cycles WHERE status = 'closed' AND book_id IS NULL"
				)
				.first()
		).toEqual({ count: 1 });
		expect(await getChatMessages(database, admin.id)).toHaveLength(1);
	});

	it('deletes an upcoming selection without changing the current book or archive', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex');
		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(database, firstCycleId, admin.id, 1, 'Piranesi', 'Susanna Clarke');
		await closeCycle(database, firstCycleId);
		await drawCycle(database, firstCycleId, admin.id);
		await advanceBook(database, firstCycleId, admin.id);
		const current = (await getDashboard(database, admin)).currentBook;
		await createCycle(database);
		const nextCycleId = await getOpenCycleId();
		await saveSuggestion(database, nextCycleId, member.id, 1, 'Dune', 'Frank Herbert');
		await closeCycle(database, nextCycleId);
		await drawCycle(database, nextCycleId, admin.id);
		expect(await deleteBookPoll(database, nextCycleId)).toBe(true);
		expect(await getDashboard(database, admin)).toMatchObject({
			currentBook: current,
			upcomingCycle: null,
			archive: []
		});
		expect(await advanceBook(database, nextCycleId, admin.id)).toBe(false);
	});

	it('enforces member-owned suggestion slots and reports progress', async () => {
		const firstMember = await createTestMember('Ramis');
		const secondMember = await createTestMember('Alex');
		await createCycle(database);
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
			{ memberId: secondMember.id, memberName: 'Alex', count: 0, cooldownDraws: 0 },
			{ memberId: firstMember.id, memberName: 'Ramis', count: 1, cooldownDraws: 0 }
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
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await fillSuggestions(cycleId, members);

		await closeCycle(database, cycleId);
		await expect(
			saveSuggestion(database, cycleId, members[0].id, 1, 'Too Late', 'Author')
		).rejects.toThrow('no longer open');

		await drawCycle(database, cycleId, members[0].id);
		await advanceBook(database, cycleId, members[0].id);
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
		await expect(drawCycle(database, cycleId, members[0].id)).rejects.toThrow(
			'no longer available'
		);
	});

	it('rejects duplicate suggestions despite punctuation, case, accents, and small misspellings', async () => {
		const member = await createTestMember('Ramis');
		await createCycle(database);
		const cycleId = await getOpenCycleId();

		await saveSuggestion(database, cycleId, member.id, 1, 'The Café at the Edge', 'John Smith');

		await expect(
			saveSuggestion(database, cycleId, member.id, 2, 'the cafe at the edeg!', 'Jon Smith')
		).rejects.toThrow('already suggested The Café at the Edge by John Smith');
		await expect(
			saveSuggestion(database, cycleId, member.id, 2, 'The Café at the Edge', 'Jane Smith')
		).resolves.toBeUndefined();
	});

	it('rejects an already selected book despite small title and author misspellings', async () => {
		const member = await createTestMember('Ramis');
		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(
			database,
			firstCycleId,
			member.id,
			1,
			'The Left Hand of Darkness',
			'Ursula K. Le Guin'
		);
		await closeCycle(database, firstCycleId);
		await drawCycle(database, firstCycleId, member.id);
		await advanceBook(database, firstCycleId, member.id);

		await createCycle(database);
		const secondCycleId = await getOpenCycleId();
		await expect(
			saveSuggestion(
				database,
				secondCycleId,
				member.id,
				1,
				'The Left Hand of Darknes',
				'Ursula K LeGuin'
			)
		).rejects.toThrow('already selected The Left Hand of Darkness by Ursula K. Le Guin');
	});

	it('allows an existing suggestion to be saved without conflicting with itself', async () => {
		const member = await createTestMember('Ramis');
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await saveSuggestion(database, cycleId, member.id, 1, 'Dune', 'Frank Herbert');
		const suggestion = await database
			.prepare('SELECT id FROM bookclub_suggestions WHERE cycle_id = ? AND member_id = ?')
			.bind(cycleId, member.id)
			.first<{ id: string }>();

		await expect(
			saveSuggestion(database, cycleId, member.id, 1, 'Dune', 'Frank Herbert', suggestion?.id)
		).resolves.toBeUndefined();
	});

	it('draws from a partially filled suggestion pool', async () => {
		const members = [await createTestMember('Ramis'), await createTestMember('Alex')];
		await createCycle(database);
		const cycleId = await getOpenCycleId();
		await saveSuggestion(database, cycleId, members[0].id, 1, 'Only Book', 'Only Author');
		await closeCycle(database, cycleId);

		await expect(drawCycle(database, cycleId, members[0].id)).resolves.toMatchObject({
			title: 'Only Book',
			author: 'Only Author'
		});
	});

	it('carries unselected suggestions into the next poll and keeps the new copies editable', async () => {
		const member = await createTestMember('Ramis');
		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(database, firstCycleId, member.id, 1, 'Dune', 'Frank Herbert');
		await saveSuggestion(database, firstCycleId, member.id, 2, 'Piranesi', 'Susanna Clarke');
		await saveSuggestion(database, firstCycleId, member.id, 3, 'Beloved', 'Toni Morrison');
		await closeCycle(database, firstCycleId);
		const selectedBook = await drawCycle(database, firstCycleId, member.id);
		await advanceBook(database, firstCycleId, member.id);

		expect(await createCycle(database)).toBe(2);
		const secondCycleId = await getOpenCycleId();
		let dashboard = await getDashboard(database, member);
		expect(dashboard.mySuggestions).toHaveLength(2);
		expect(dashboard.mySuggestions).not.toContainEqual(
			expect.objectContaining({ title: selectedBook.title, author: selectedBook.author })
		);

		const suggestionToChange = dashboard.mySuggestions[0];
		await saveSuggestion(
			database,
			secondCycleId,
			member.id,
			suggestionToChange.position,
			'Replacement Book',
			'Replacement Author',
			suggestionToChange.id
		);
		dashboard = await getDashboard(database, member);
		expect(dashboard.mySuggestions).toContainEqual(
			expect.objectContaining({
				id: suggestionToChange.id,
				title: 'Replacement Book',
				author: 'Replacement Author'
			})
		);

		expect(await deleteSuggestion(database, suggestionToChange.id, member.id)).toBe(true);
		dashboard = await getDashboard(database, member);
		expect(dashboard.mySuggestions).toHaveLength(1);

		await saveSuggestion(
			database,
			secondCycleId,
			member.id,
			suggestionToChange.position,
			'Fresh Suggestion',
			'Fresh Author'
		);
		dashboard = await getDashboard(database, member);
		expect(dashboard.mySuggestions).toContainEqual(
			expect.objectContaining({
				position: suggestionToChange.position,
				title: 'Fresh Suggestion',
				author: 'Fresh Author'
			})
		);

		const historicalSuggestions = await database
			.prepare(
				'SELECT title, author FROM bookclub_suggestions WHERE cycle_id = ? ORDER BY position'
			)
			.bind(firstCycleId)
			.all<{ title: string; author: string }>();
		expect(historicalSuggestions.results).toEqual([
			{ title: 'Dune', author: 'Frank Herbert' },
			{ title: 'Piranesi', author: 'Susanna Clarke' },
			{ title: 'Beloved', author: 'Toni Morrison' }
		]);
	});

	it("does not carry another member's duplicate ticket for the selected book", async () => {
		const firstMember = await createTestMember('Ramis');
		const secondMember = await createTestMember('Alex');
		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(database, firstCycleId, firstMember.id, 1, 'Dune', 'Frank Herbert');
		await saveSuggestion(database, firstCycleId, secondMember.id, 1, 'Dune!', 'Frank  Herbert');
		await closeCycle(database, firstCycleId);
		await drawCycle(database, firstCycleId, firstMember.id);
		await advanceBook(database, firstCycleId, firstMember.id);

		expect(await createCycle(database)).toBe(0);
		expect((await getDashboard(database, firstMember)).mySuggestions).toEqual([]);
		expect((await getDashboard(database, secondMember)).mySuggestions).toEqual([]);
	});

	it('lists past books and deletes a book poll with its associated data', async () => {
		const member = await createTestMember('Ramis');
		const secondMember = await createTestMember('Alex');

		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(
			database,
			firstCycleId,
			member.id,
			1,
			'First Archive Book',
			'First Author'
		);
		await closeCycle(database, firstCycleId);
		const firstBook = await drawCycle(database, firstCycleId, member.id);
		await advanceBook(database, firstCycleId, member.id);
		await database
			.prepare(
				`INSERT INTO bookclub_reviews (id, book_id, member_id, rating, body)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), firstBook.id, member.id, 5, 'A test review')
			.run();

		await createCycle(database);
		const secondCycleId = await getOpenCycleId();
		expect((await getDashboard(database, member)).currentBook?.id).toBe(firstBook.id);
		await saveSuggestion(
			database,
			secondCycleId,
			secondMember.id,
			1,
			'Second Archive Book',
			'Second Author'
		);
		await closeCycle(database, secondCycleId);
		expect((await getDashboard(database, member)).currentBook?.id).toBe(firstBook.id);
		await drawCycle(database, secondCycleId, member.id);
		await advanceBook(database, secondCycleId, member.id);
		expect(
			await database
				.prepare('SELECT started_at, completed_at FROM bookclub_books WHERE id = ?')
				.bind(firstBook.id)
				.first<{ started_at: string; completed_at: string | null }>()
		).toMatchObject({ started_at: expect.any(String), completed_at: expect.any(String) });

		expect(await getArchive(database)).toMatchObject([
			{
				id: firstCycleId,
				book: { id: firstBook.id, title: 'First Archive Book' },
				reviewCount: 1
			}
		]);
		expect(await getBookPollSummaries(database)).toHaveLength(2);

		expect(await deleteBookPoll(database, secondCycleId)).toBe(true);
		expect((await getDashboard(database, member)).currentBook?.id).toBe(firstBook.id);
		expect(
			await database
				.prepare('SELECT completed_at FROM bookclub_books WHERE id = ?')
				.bind(firstBook.id)
				.first<{ completed_at: string | null }>()
		).toEqual({ completed_at: null });

		expect(await deleteBookPoll(database, firstCycleId)).toBe(true);
		expect(await deleteBookPoll(database, firstCycleId)).toBe(false);
		expect(
			await database
				.prepare(
					`SELECT
					 (SELECT COUNT(*) FROM bookclub_reviews WHERE book_id = ?) AS reviews,
					 (SELECT COUNT(*) FROM bookclub_draws WHERE cycle_id = ?) AS draws,
					 (SELECT COUNT(*) FROM bookclub_suggestions WHERE cycle_id = ?) AS suggestions,
					 (SELECT COUNT(*) FROM bookclub_cycles WHERE id = ?) AS cycles,
					 (SELECT COUNT(*) FROM bookclub_books WHERE id = ?) AS books`
				)
				.bind(firstBook.id, firstCycleId, firstCycleId, firstCycleId, firstBook.id)
				.first<{
					reviews: number;
					draws: number;
					suggestions: number;
					cycles: number;
					books: number;
				}>()
		).toEqual({ reviews: 0, draws: 0, suggestions: 0, cycles: 0, books: 0 });

		expect(await getBookPollSummaries(database)).toEqual([]);
	});

	it('stores editable member reviews only after a book is archived and exposes a stable draw replay', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex');
		const nextMember = await createTestMember('Blair');

		await createCycle(database);
		const firstCycleId = await getOpenCycleId();
		await saveSuggestion(database, firstCycleId, admin.id, 1, 'Piranesi', 'Susanna Clarke');
		await saveSuggestion(database, firstCycleId, member.id, 1, 'Dune', 'Frank Herbert');
		await closeCycle(database, firstCycleId);
		const firstBook = await drawCycle(database, firstCycleId, admin.id);
		await advanceBook(database, firstCycleId, admin.id);

		const replay = await getDrawReplay(database, firstCycleId);
		expect(replay).toMatchObject({
			cycleId: firstCycleId,
			book: { id: firstBook.id }
		});
		expect(replay?.suggestions).toEqual(
			expect.arrayContaining(
				[
					{ title: 'Piranesi', memberName: 'Ramis' },
					{ title: 'Dune', memberName: 'Alex' }
				].map((suggestion) => expect.objectContaining(suggestion))
			)
		);
		expect(
			replay?.suggestions.some((suggestion) => suggestion.id === replay.winnerSuggestionId)
		).toBe(true);

		await expect(
			saveBookReview(database, firstBook.id, member.id, {
				rating: 4,
				body: 'Not archived yet.',
				favouriteQuote: '',
				spoiler: false,
				verdict: ''
			})
		).rejects.toThrow('completed archived books');

		await createCycle(database);
		const secondCycleId = await getOpenCycleId();
		await saveSuggestion(database, secondCycleId, nextMember.id, 2, 'Beloved', 'Toni Morrison');
		await closeCycle(database, secondCycleId);
		await drawCycle(database, secondCycleId, admin.id);
		await advanceBook(database, secondCycleId, admin.id);

		await saveBookReview(database, firstBook.id, member.id, {
			rating: 4,
			body: 'Strange and memorable.',
			favouriteQuote: 'A favourite line.',
			spoiler: true,
			verdict: 'Worth discussing'
		});
		await saveBookReview(database, firstBook.id, member.id, {
			rating: 5,
			body: 'Even better after the meeting.',
			favouriteQuote: '',
			spoiler: false,
			verdict: 'Excellent'
		});

		expect(await getBookReviews(database, firstBook.id)).toMatchObject([
			{
				memberId: member.id,
				memberName: 'Alex',
				rating: 5,
				body: 'Even better after the meeting.',
				favouriteQuote: null,
				spoiler: false,
				verdict: 'Excellent'
			}
		]);
		expect(await deleteOwnBookReview(database, firstBook.id, admin.id)).toBe(false);
		expect(await deleteOwnBookReview(database, firstBook.id, member.id)).toBe(true);
		expect(await getBookReviews(database, firstBook.id)).toEqual([]);
	});
});

describe('book-club chat and meetings', () => {
	it('tombstones user messages without deleting announcements or other members messages', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const member = await createTestMember('Alex');
		const otherMember = await createTestMember('Blair');

		await setMemberChatColor(database, member.id, '#123abc');
		await database
			.prepare('UPDATE bookclub_members SET last_seen_at = ? WHERE id = ?')
			.bind(new Date().toISOString(), member.id)
			.run();
		await createChatMessage(database, member.id, 'Member message');
		await database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body, message_type)
				 VALUES (?, ?, ?, 'announcement')`
			)
			.bind(crypto.randomUUID(), admin.id, 'SYSTEM: Important club notice')
			.run();
		await database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body)
				 VALUES (?, ?, ?)`
			)
			.bind(crypto.randomUUID(), otherMember.id, 'Other member message')
			.run();

		const before = await getChatMessages(database, member.id);
		const memberMessage = before.find((message) => message.body === 'Member message');
		const announcement = before.find((message) => message.isAnnouncement);
		const otherMessage = before.find((message) => message.body === 'Other member message');

		expect(memberMessage).toBeTruthy();
		expect(announcement).toBeTruthy();
		expect(otherMessage).toBeTruthy();
		expect(memberMessage).toMatchObject({
			memberColor: '#123abc',
			memberColorNeedsOutline: true
		});
		expect(await getChatMembers(database, member.id)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: member.id, isOwn: true, isOnline: true }),
				expect.objectContaining({ id: otherMember.id, isOnline: false })
			])
		);

		await expect(
			tombstoneChatMessageByAdmin(database, memberMessage?.id ?? '', admin.id)
		).resolves.toBe(true);
		expect(await tombstoneChatMessageByAdmin(database, announcement?.id ?? '', admin.id)).toBe(
			false
		);
		expect(await tombstoneOwnChatMessage(database, otherMessage?.id ?? '', member.id)).toBe(false);
		expect(await tombstoneChatMessageByAdmin(database, memberMessage?.id ?? '', admin.id)).toBe(
			false
		);

		const afterAdminDelete = await getChatMessages(database, member.id);
		expect(afterAdminDelete.find((message) => message.id === memberMessage?.id)).toMatchObject({
			body: '[DELETED BY ADMIN]',
			isDeleted: true,
			canRestore: true
		});
		expect(await restoreChatMessage(database, memberMessage?.id ?? '', admin.id, true)).toBe(true);
		expect(await restoreChatMessage(database, memberMessage?.id ?? '', admin.id, true)).toBe(false);
		expect(await getChatMessages(database, member.id)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: memberMessage?.id,
					body: 'Member message',
					isDeleted: false,
					canRestore: false
				})
			])
		);
		expect(afterAdminDelete.find((message) => message.id === announcement?.id)).toMatchObject({
			body: 'SYSTEM: Important club notice',
			isDeleted: false
		});

		const ownMessageId = crypto.randomUUID();
		await database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body)
				 VALUES (?, ?, ?)`
			)
			.bind(ownMessageId, member.id, 'Own message to remove')
			.run();

		expect(await tombstoneOwnChatMessage(database, ownMessageId, member.id)).toBe(true);
		expect(await restoreChatMessage(database, ownMessageId, admin.id, true)).toBe(false);
		expect(await restoreChatMessage(database, ownMessageId, member.id, false)).toBe(true);
		expect(await getChatMessages(database, member.id)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: ownMessageId,
					body: 'Own message to remove',
					isDeleted: false,
					canRestore: false
				})
			])
		);

		const adminOwnMessageId = crypto.randomUUID();
		await database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body)
				 VALUES (?, ?, ?)`
			)
			.bind(adminOwnMessageId, admin.id, 'Admin own message')
			.run();
		expect(await tombstoneOwnChatMessage(database, adminOwnMessageId, admin.id)).toBe(true);
		expect(await restoreChatMessage(database, adminOwnMessageId, admin.id, true)).toBe(true);
		expect(await getChatMessages(database, admin.id)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: adminOwnMessageId,
					body: 'Admin own message',
					isDeleted: false,
					canRestore: false
				})
			])
		);
	});

	it('enforces the chat cooldown and cleans messages older than thirty days', async () => {
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
				new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
			)
			.run();

		const messages = await getChatMessages(database, member.id);
		expect(messages.map((message) => message.body)).toEqual(['Fresh message']);
		expect(
			await database
				.prepare('SELECT COUNT(*) AS count FROM bookclub_chat_messages WHERE body = ?')
				.bind('Old message')
				.first<{ count: number }>()
		).toMatchObject({ count: 1 });

		await cleanupBookclubData(database);
		expect(
			await database
				.prepare('SELECT COUNT(*) AS count FROM bookclub_chat_messages WHERE body = ?')
				.bind('Old message')
				.first<{ count: number }>()
		).toMatchObject({ count: 0 });
	});

	it('cleans expired sessions and old terminal invitations', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const now = Date.now();
		const oldDate = new Date(now - 91 * 24 * 60 * 60 * 1000).toISOString();

		await database
			.prepare(
				`INSERT INTO bookclub_sessions (id, member_id, token_hash, expires_at)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(
				crypto.randomUUID(),
				admin.id,
				'expired-token-hash',
				new Date(now - 1_000).toISOString()
			)
			.run();

		await database.batch(
			Array.from({ length: 51 }, (_, index) =>
				database
					.prepare(
						`INSERT INTO bookclub_invitations
						 (id, purpose, token_hash, member_id, created_by_member_id, expires_at, consumed_at, created_at)
						 VALUES (?, 'reset', ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						crypto.randomUUID(),
						`old-token-${index}`,
						admin.id,
						admin.id,
						oldDate,
						oldDate,
						oldDate
					)
			)
		);
		await database
			.prepare(
				`INSERT INTO bookclub_invitations
				 (id, purpose, token_hash, member_id, created_by_member_id, expires_at, created_at)
				 VALUES (?, 'reset', ?, ?, ?, ?, ?)`
			)
			.bind(
				crypto.randomUUID(),
				'active-old-token',
				admin.id,
				admin.id,
				new Date(now + 1_000).toISOString(),
				oldDate
			)
			.run();

		await cleanupBookclubData(database, new Date(now));

		expect(
			await database
				.prepare('SELECT COUNT(*) AS count FROM bookclub_sessions')
				.first<{ count: number }>()
		).toMatchObject({ count: 0 });
		expect(
			await database
				.prepare('SELECT COUNT(*) AS count FROM bookclub_invitations')
				.first<{ count: number }>()
		).toMatchObject({ count: 51 });
	});

	it('reschedules past meetings two weeks forward during maintenance', async () => {
		const admin = await createTestMember('Ramis', 'admin');
		const now = Date.now();
		const twoWeeks = 14 * 24 * 60 * 60 * 1000;
		const meetingId = crypto.randomUUID();
		const justPassed = new Date(now - 1_000);

		await database
			.prepare(
				`INSERT INTO bookclub_meetings (id, scheduled_for, note, scheduled_by_member_id)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(meetingId, justPassed.toISOString(), 'Bring snacks', admin.id)
			.run();

		await cleanupBookclubData(database, new Date(now));

		const firstReschedule = new Date(justPassed.getTime() + twoWeeks).toISOString();
		expect(await getNextMeeting(database)).toMatchObject({
			id: meetingId,
			scheduledFor: firstReschedule,
			note: 'Bring snacks'
		});
		expect((await getChatMessages(database, admin.id)).map((message) => message.body)).toContain(
			`MEETING UPDATED: ${firstReschedule} (Bring snacks) (auto-rescheduled)`
		);

		// A meeting missed by several periods jumps straight to the next future slot.
		const longPast = new Date(now - 29 * 24 * 60 * 60 * 1000);
		await database
			.prepare('UPDATE bookclub_meetings SET scheduled_for = ? WHERE id = ?')
			.bind(longPast.toISOString(), meetingId)
			.run();

		await cleanupBookclubData(database, new Date(now));

		expect(await getNextMeeting(database)).toMatchObject({
			id: meetingId,
			scheduledFor: new Date(longPast.getTime() + 3 * twoWeeks).toISOString()
		});
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
