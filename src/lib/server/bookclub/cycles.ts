import type { D1Database } from '@cloudflare/workers-types';
import type { BookclubMember } from './db';
import { getChatMessages, prepareChatAnnouncement, type BookclubChatMessage } from './chat';
import { getNextMeeting, type BookclubMeeting } from './meetings';

const SUGGESTION_LIMIT = 3;

export interface BookclubBook {
	id: string;
	title: string;
	author: string;
	coverUrl: string | null;
	startedAt: string | null;
}

export interface BookclubCycle {
	id: string;
	label: string;
	status: 'open' | 'closed' | 'drawn';
	suggestionLimit: number;
	book: BookclubBook | null;
}

export interface BookclubSuggestion {
	id: string;
	position: number;
	title: string;
	author: string;
	memberId: string;
	memberName: string;
}

export interface SuggestionProgress {
	memberId: string;
	memberName: string;
	count: number;
}

export interface BookclubDashboard {
	currentBook: BookclubBook | null;
	currentCycle: BookclubCycle | null;
	activeCycle: BookclubCycle | null;
	drawReadyCycle: BookclubCycle | null;
	mySuggestions: BookclubSuggestion[];
	suggestionProgress: SuggestionProgress[];
	nextMeeting: BookclubMeeting | null;
	chatMessages: BookclubChatMessage[];
}

interface CycleRow {
	id: string;
	label: string;
	status: BookclubCycle['status'];
	suggestion_limit: number;
	book_id: string | null;
	book_title: string | null;
	book_author: string | null;
	book_cover_url: string | null;
	book_started_at: string | null;
}

interface SuggestionRow {
	id: string;
	position: number;
	title: string;
	author: string;
	member_id: string;
	member_name: string;
}

interface ProgressRow {
	member_id: string;
	member_name: string;
	count: number;
}

function toCycle(row: CycleRow | null): BookclubCycle | null {
	if (!row) return null;

	return {
		id: row.id,
		label: row.label,
		status: row.status,
		suggestionLimit: row.suggestion_limit,
		book:
			row.book_id && row.book_title && row.book_author
				? {
						id: row.book_id,
						title: row.book_title,
						author: row.book_author,
						coverUrl: row.book_cover_url,
						startedAt: row.book_started_at
					}
				: null
	};
}

export async function getDashboard(
	database: D1Database,
	member: BookclubMember
): Promise<BookclubDashboard> {
	const [currentCycle, actionCycle, mySuggestions, suggestionProgress, nextMeeting, chatMessages] =
		await Promise.all([
			database
				.prepare(
					`SELECT c.id, c.label, c.status, c.suggestion_limit, c.book_id,
				        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
				        b.started_at AS book_started_at
				 FROM bookclub_cycles AS c
				 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
				 ORDER BY c.created_at DESC
				 LIMIT 1`
				)
				.all<CycleRow>(),
			database
				.prepare(
					`SELECT c.id, c.label, c.status, c.suggestion_limit, c.book_id,
				        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
				        b.started_at AS book_started_at
				 FROM bookclub_cycles AS c
				 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
				 WHERE c.status IN ('open', 'closed')
				 ORDER BY c.created_at DESC
				 LIMIT 1`
				)
				.all<CycleRow>(),
			database
				.prepare(
					`SELECT s.id, s.position, s.title, s.author,
				        s.member_id, m.name AS member_name
				 FROM bookclub_suggestions AS s
				 INNER JOIN bookclub_members AS m ON m.id = s.member_id
				 INNER JOIN bookclub_cycles AS c ON c.id = s.cycle_id
				 WHERE s.member_id = ? AND c.status = 'open'
				 ORDER BY s.position`
				)
				.bind(member.id)
				.all<SuggestionRow>(),
			database
				.prepare(
					`SELECT m.id AS member_id, m.name AS member_name, COUNT(s.id) AS count
				 FROM bookclub_members AS m
				 LEFT JOIN bookclub_suggestions AS s
				   ON s.member_id = m.id
				  AND s.cycle_id = (
					  SELECT id FROM bookclub_cycles
					  WHERE status IN ('open', 'closed')
					  ORDER BY created_at DESC
					  LIMIT 1
				  )
				 WHERE m.active = 1
				 GROUP BY m.id, m.name
				 ORDER BY m.name`
				)
				.all<ProgressRow>(),
			getNextMeeting(database),
			getChatMessages(database, member.id)
		]);

	const currentCycleValue = toCycle(currentCycle.results[0] ?? null);
	const actionCycleValue = toCycle(actionCycle.results[0] ?? null);

	return {
		currentBook: currentCycleValue?.book ?? null,
		currentCycle: currentCycleValue,
		activeCycle: actionCycleValue?.status === 'open' ? actionCycleValue : null,
		drawReadyCycle: actionCycleValue?.status === 'closed' ? actionCycleValue : null,
		mySuggestions: mySuggestions.results.map((suggestion) => ({
			id: suggestion.id,
			position: suggestion.position,
			title: suggestion.title,
			author: suggestion.author,
			memberId: suggestion.member_id,
			memberName: suggestion.member_name
		})),
		suggestionProgress: suggestionProgress.results.map((progress) => ({
			memberId: progress.member_id,
			memberName: progress.member_name,
			count: progress.count
		})),
		nextMeeting,
		chatMessages
	};
}

export async function getLatestActionCycle(database: D1Database): Promise<BookclubCycle | null> {
	const cycle = await database
		.prepare(
			`SELECT c.id, c.label, c.status, c.suggestion_limit, c.book_id,
			        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
			        b.started_at AS book_started_at
			 FROM bookclub_cycles AS c
			 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE c.status IN ('open', 'closed')
			 ORDER BY c.created_at DESC
			 LIMIT 1`
		)
		.first<CycleRow>();

	return toCycle(cycle);
}

export async function createCycle(database: D1Database, label: string): Promise<void> {
	await database
		.prepare(
			`INSERT INTO bookclub_cycles (id, label, status, suggestion_limit)
			 VALUES (?, ?, 'open', ?)`
		)
		.bind(crypto.randomUUID(), label, SUGGESTION_LIMIT)
		.run();
}

export async function saveSuggestion(
	database: D1Database,
	cycleId: string,
	memberId: string,
	position: number,
	title: string,
	author: string,
	suggestionId?: string
): Promise<void> {
	if (suggestionId) {
		const result = await database
			.prepare(
				`UPDATE bookclub_suggestions
				 SET title = ?, author = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
				 WHERE id = ? AND cycle_id = ? AND member_id = ?
				   AND EXISTS (
					   SELECT 1 FROM bookclub_cycles
					   WHERE id = ? AND status = 'open'
				   )`
			)
			.bind(title, author, suggestionId, cycleId, memberId, cycleId)
			.run();

		if (!result.meta.changes) {
			throw new Error('That suggestion is no longer available.');
		}
		return;
	}

	const result = await database
		.prepare(
			`INSERT INTO bookclub_suggestions (id, cycle_id, member_id, position, title, author)
			 SELECT ?, ?, ?, ?, ?, ?
			 WHERE EXISTS (
				 SELECT 1 FROM bookclub_cycles
				 WHERE id = ? AND status = 'open'
			 )`
		)
		.bind(crypto.randomUUID(), cycleId, memberId, position, title, author, cycleId)
		.run();

	if (!result.meta.changes) {
		throw new Error('That suggestion cycle is no longer open.');
	}
}

export async function deleteSuggestion(
	database: D1Database,
	suggestionId: string,
	memberId: string
): Promise<boolean> {
	const result = await database
		.prepare(
			`DELETE FROM bookclub_suggestions
			 WHERE id = ? AND member_id = ?
			   AND cycle_id IN (SELECT id FROM bookclub_cycles WHERE status = 'open')`
		)
		.bind(suggestionId, memberId)
		.run();

	return Boolean(result.meta.changes);
}

export async function closeCycle(database: D1Database, cycleId: string): Promise<void> {
	const result = await database
		.prepare(
			`UPDATE bookclub_cycles
			 SET status = 'closed', closed_at = COALESCE(closed_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
			 WHERE id = ? AND status = 'open'`
		)
		.bind(cycleId)
		.run();

	if (!result.meta.changes) {
		throw new Error('This cycle is no longer open.');
	}
}

export async function drawCycle(
	database: D1Database,
	cycleId: string,
	drawnByMemberId: string,
	allowIncomplete: boolean
): Promise<BookclubBook> {
	const cycle = await database
		.prepare(
			`SELECT id, status, suggestion_limit
			 FROM bookclub_cycles
			 WHERE id = ?
			 LIMIT 1`
		)
		.bind(cycleId)
		.first<{ id: string; status: BookclubCycle['status']; suggestion_limit: number }>();

	if (!cycle || !['open', 'closed'].includes(cycle.status)) {
		throw new Error('This cycle is no longer available for drawing.');
	}

	const suggestions = await database
		.prepare(
			`SELECT id, title, author
			 FROM bookclub_suggestions
			 WHERE cycle_id = ?
			 ORDER BY id`
		)
		.bind(cycleId)
		.all<{ id: string; title: string; author: string }>();

	if (suggestions.results.length === 0) {
		throw new Error('Add at least one suggestion before drawing.');
	}

	if (!allowIncomplete) {
		const activeMembers = await database
			.prepare('SELECT COUNT(*) AS count FROM bookclub_members WHERE active = 1')
			.first<{ count: number }>();
		const required = (activeMembers?.count ?? 0) * cycle.suggestion_limit;

		if (suggestions.results.length < required) {
			throw new Error(
				'Every active member must use all suggestion slots, or choose the admin override.'
			);
		}
	}

	const winner =
		suggestions.results[crypto.getRandomValues(new Uint32Array(1))[0] % suggestions.results.length];
	const bookId = crypto.randomUUID();
	const now = new Date().toISOString();

	await database.batch([
		database
			.prepare(
				`INSERT INTO bookclub_books (id, title, author, started_at)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(bookId, winner.title, winner.author, now),
		database
			.prepare(
				`UPDATE bookclub_cycles
					 SET status = 'drawn', book_id = ?, closed_at = COALESCE(closed_at, ?)
					 WHERE id = ? AND status IN ('open', 'closed')`
			)
			.bind(bookId, now, cycleId),
		prepareChatAnnouncement(
			database,
			drawnByMemberId,
			`CURRENT BOOK: ${winner.title} by ${winner.author}.`
		),
		database
			.prepare(
				`INSERT INTO bookclub_draws (id, cycle_id, suggestion_id, drawn_by_member_id)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), cycleId, winner.id, drawnByMemberId)
	]);

	return {
		id: bookId,
		title: winner.title,
		author: winner.author,
		coverUrl: null,
		startedAt: now
	};
}

export async function setBookCover(
	database: D1Database,
	bookId: string,
	coverUrl: string
): Promise<void> {
	await database
		.prepare('UPDATE bookclub_books SET cover_url = ? WHERE id = ?')
		.bind(coverUrl, bookId)
		.run();
}
