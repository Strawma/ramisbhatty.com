import type { D1Database } from '@cloudflare/workers-types';
import type { BookclubMember } from './db';
import { getChatroomState, type BookclubChatMember, type BookclubChatMessage } from './chat';
import { getNextMeeting, type BookclubMeeting } from './meetings';

const SUGGESTION_LIMIT = 3;
const WINNER_COOLDOWN_DRAWS = 2;

export interface BookclubBook {
	id: string;
	title: string;
	author: string;
	coverUrl: string | null;
	startedAt: string | null;
	completedAt: string | null;
}

export interface BookclubCycle {
	id: string;
	status: 'open' | 'closed' | 'drawn';
	suggestionLimit: number;
	book: BookclubBook | null;
	openedAt: string;
	closedAt: string | null;
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
	cooldownDraws: number;
}

export interface BookclubDashboard {
	currentBook: BookclubBook | null;
	currentCycle: BookclubCycle | null;
	upcomingCycle: BookclubCycle | null;
	activeCycle: BookclubCycle | null;
	drawReadyCycle: BookclubCycle | null;
	mySuggestions: BookclubSuggestion[];
	suggestionProgress: SuggestionProgress[];
	nextMeeting: BookclubMeeting | null;
	chatMessages: BookclubChatMessage[];
	chatMembers: BookclubChatMember[];
	archive: BookclubArchiveEntry[];
}

export interface BookclubArchiveEntry {
	id: string;
	openedAt: string;
	book: BookclubBook;
	reviewCount: number;
}

export interface BookclubBookPollSummary {
	id: string;
	status: BookclubCycle['status'];
	openedAt: string;
	closedAt: string | null;
	book: BookclubBook | null;
	suggestionCount: number;
	reviewCount: number;
}

export interface BookclubDrawReplay {
	cycleId: string;
	drawId: string;
	drawnAt: string;
	winnerSuggestionId: string;
	book: BookclubBook;
	suggestions: BookclubSuggestion[];
	rerolls: BookclubReroll[];
}

export interface BookclubReroll {
	id: string;
	previousTitle: string;
	previousAuthor: string;
	reason: string;
	memberName: string;
	rerolledAt: string;
}

interface CycleRow {
	id: string;
	status: BookclubCycle['status'];
	suggestion_limit: number;
	book_id: string | null;
	book_title: string | null;
	book_author: string | null;
	book_cover_url: string | null;
	book_started_at: string | null;
	book_completed_at: string | null;
	opened_at: string;
	closed_at: string | null;
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

interface CarryoverSuggestionRow {
	member_id: string;
	position: number;
	title: string;
	author: string;
}

interface CarryoverSourceRow {
	id: string;
	winner_title: string;
	winner_author: string;
}

interface ArchiveRow {
	id: string;
	opened_at: string;
	book_id: string;
	book_title: string;
	book_author: string;
	book_cover_url: string | null;
	book_started_at: string | null;
	book_completed_at: string | null;
	review_count: number;
}

interface BookPollSummaryRow extends ArchiveRow {
	status: BookclubCycle['status'];
	closed_at: string | null;
	suggestion_count: number;
}

export type SuggestionConflictKind =
	'duplicate-suggestion' | 'previously-read' | 'already-selected';

export class SuggestionConflictError extends Error {
	constructor(
		public readonly kind: SuggestionConflictKind,
		public readonly matchedTitle: string,
		public readonly matchedAuthor: string
	) {
		super(
			kind === 'previously-read'
				? `The club has already read ${matchedTitle} by ${matchedAuthor}.`
				: kind === 'already-selected'
					? `The club has already selected ${matchedTitle} by ${matchedAuthor}.`
					: `You have already suggested ${matchedTitle} by ${matchedAuthor}.`
		);
		this.name = 'SuggestionConflictError';
	}
}

function normalizeBookField(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('en-GB')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.replace(/\s+/g, ' ');
}

function editDistance(first: string, second: string): number {
	if (first === second) return 0;
	if (first.length === 0) return second.length;
	if (second.length === 0) return first.length;

	let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
	for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
		const current = [firstIndex];
		for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
			current[secondIndex] = Math.min(
				current[secondIndex - 1] + 1,
				previous[secondIndex] + 1,
				previous[secondIndex - 1] + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1)
			);
		}
		previous = current;
	}

	return previous[second.length];
}

function bookFieldMatches(first: string, second: string): boolean {
	const normalizedFirst = normalizeBookField(first);
	const normalizedSecond = normalizeBookField(second);
	if (normalizedFirst === normalizedSecond) return true;
	const firstNumbers = normalizedFirst.match(/\d+/g) ?? [];
	const secondNumbers = normalizedSecond.match(/\d+/g) ?? [];
	if (firstNumbers.join(',') !== secondNumbers.join(',')) return false;

	const longestLength = Math.max(normalizedFirst.length, normalizedSecond.length);
	if (longestLength < 5 || Math.abs(normalizedFirst.length - normalizedSecond.length) > 3) {
		return false;
	}

	return (
		editDistance(normalizedFirst, normalizedSecond) <= Math.min(3, Math.floor(longestLength / 6))
	);
}

async function assertSuggestionIsAvailable(
	database: D1Database,
	cycleId: string,
	memberId: string,
	title: string,
	author: string,
	suggestionId?: string
): Promise<void> {
	const [suggestions, books] = await Promise.all([
		database
			.prepare(
				`SELECT title, author
				 FROM bookclub_suggestions
				 WHERE cycle_id = ? AND member_id = ? AND (? IS NULL OR id != ?)`
			)
			.bind(cycleId, memberId, suggestionId ?? null, suggestionId ?? null)
			.all<{ title: string; author: string }>(),
		database
			.prepare('SELECT title, author, completed_at FROM bookclub_books')
			.all<{ title: string; author: string; completed_at: string | null }>()
	]);

	const duplicate = suggestions.results.find(
		(candidate) =>
			bookFieldMatches(title, candidate.title) && bookFieldMatches(author, candidate.author)
	);
	if (duplicate) {
		throw new SuggestionConflictError('duplicate-suggestion', duplicate.title, duplicate.author);
	}

	const previouslyRead = books.results.find(
		(candidate) =>
			bookFieldMatches(title, candidate.title) && bookFieldMatches(author, candidate.author)
	);
	if (previouslyRead) {
		throw new SuggestionConflictError(
			previouslyRead.completed_at ? 'previously-read' : 'already-selected',
			previouslyRead.title,
			previouslyRead.author
		);
	}
}

function toCycle(row: CycleRow | null): BookclubCycle | null {
	if (!row) return null;

	return {
		id: row.id,
		status: row.status,
		suggestionLimit: row.suggestion_limit,
		openedAt: row.opened_at,
		closedAt: row.closed_at,
		book:
			row.book_id && row.book_title && row.book_author
				? {
						id: row.book_id,
						title: row.book_title,
						author: row.book_author,
						coverUrl: row.book_cover_url,
						startedAt: row.book_started_at,
						completedAt: row.book_completed_at
					}
				: null
	};
}

function toArchiveEntry(row: ArchiveRow): BookclubArchiveEntry {
	return {
		id: row.id,
		openedAt: row.opened_at,
		book: {
			id: row.book_id,
			title: row.book_title,
			author: row.book_author,
			coverUrl: row.book_cover_url,
			startedAt: row.book_started_at,
			completedAt: row.book_completed_at
		},
		reviewCount: row.review_count
	};
}

function toBookPollSummary(row: BookPollSummaryRow): BookclubBookPollSummary {
	return {
		id: row.id,
		status: row.status,
		openedAt: row.opened_at,
		closedAt: row.closed_at,
		book:
			row.book_id && row.book_title && row.book_author
				? {
						id: row.book_id,
						title: row.book_title,
						author: row.book_author,
						coverUrl: row.book_cover_url,
						startedAt: row.book_started_at,
						completedAt: row.book_completed_at
					}
				: null,
		suggestionCount: row.suggestion_count,
		reviewCount: row.review_count
	};
}

export async function getDashboard(
	database: D1Database,
	member: BookclubMember
): Promise<BookclubDashboard> {
	const [
		currentCycle,
		upcomingCycle,
		actionCycle,
		mySuggestions,
		suggestionProgress,
		nextMeeting,
		chatroomState,
		archive
	] = await Promise.all([
		database
			.prepare(
				`SELECT c.id, c.status, c.suggestion_limit, c.book_id,
				        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
				        b.started_at AS book_started_at, b.completed_at AS book_completed_at,
				        c.opened_at, c.closed_at
					 FROM bookclub_cycles AS c
					 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
					 WHERE c.status = 'drawn' AND b.started_at IS NOT NULL AND b.completed_at IS NULL
					 ORDER BY b.started_at DESC, c.created_at DESC, c.id DESC
				 LIMIT 1`
			)
			.all<CycleRow>(),
		getUpcomingCycle(database),
		database
			.prepare(
				`SELECT c.id, c.status, c.suggestion_limit, c.book_id,
				        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
				        b.started_at AS book_started_at, b.completed_at AS book_completed_at,
				        c.opened_at, c.closed_at
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
		getChatroomState(database, member.id),
		getArchive(database)
	]);

	const cooldowns = await getWinnerCooldowns(database);
	const currentCycleValue = toCycle(currentCycle.results[0] ?? null);
	const actionCycleValue = toCycle(actionCycle.results[0] ?? null);

	return {
		currentBook: currentCycleValue?.book ?? null,
		currentCycle: currentCycleValue,
		upcomingCycle,
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
			count: progress.count,
			cooldownDraws: cooldowns.get(progress.member_id) ?? 0
		})),
		nextMeeting,
		chatMessages: chatroomState.messages,
		chatMembers: chatroomState.members,
		archive
	};
}

export async function getUpcomingCycle(database: D1Database): Promise<BookclubCycle | null> {
	const row = await database
		.prepare(
			`SELECT c.id, c.status, c.suggestion_limit, c.book_id,
			        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
			        b.started_at AS book_started_at, b.completed_at AS book_completed_at,
			        c.opened_at, c.closed_at
			 FROM bookclub_cycles AS c
			 INNER JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE c.status = 'drawn' AND b.started_at IS NULL
			 LIMIT 1`
		)
		.first<CycleRow>();
	return toCycle(row);
}

export async function getLatestActionCycle(database: D1Database): Promise<BookclubCycle | null> {
	const cycle = await database
		.prepare(
			`SELECT c.id, c.status, c.suggestion_limit, c.book_id,
			        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
			        b.started_at AS book_started_at, b.completed_at AS book_completed_at,
			        c.opened_at, c.closed_at
			 FROM bookclub_cycles AS c
			 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE c.status IN ('open', 'closed')
			 ORDER BY c.created_at DESC
			 LIMIT 1`
		)
		.first<CycleRow>();

	return toCycle(cycle);
}

const ARCHIVE_BOOK_QUERY = `
	SELECT c.id, c.opened_at,
	       b.id AS book_id, b.title AS book_title, b.author AS book_author,
	       b.cover_url AS book_cover_url, b.started_at AS book_started_at,
	       b.completed_at AS book_completed_at,
	       (SELECT COUNT(*) FROM bookclub_reviews AS r WHERE r.book_id = b.id) AS review_count
	FROM bookclub_cycles AS c
	INNER JOIN bookclub_books AS b ON b.id = c.book_id
	WHERE c.status = 'drawn'
	  AND b.started_at IS NOT NULL AND b.completed_at IS NOT NULL
`;

export async function getArchive(database: D1Database): Promise<BookclubArchiveEntry[]> {
	const result = await database
		.prepare(`${ARCHIVE_BOOK_QUERY} ORDER BY c.created_at DESC, c.id DESC`)
		.all<ArchiveRow>();

	return result.results.map(toArchiveEntry);
}

export async function getArchiveEntry(
	database: D1Database,
	cycleId: string
): Promise<BookclubArchiveEntry | null> {
	const row = await database
		.prepare(`${ARCHIVE_BOOK_QUERY} AND c.id = ? LIMIT 1`)
		.bind(cycleId)
		.first<ArchiveRow>();

	return row ? toArchiveEntry(row) : null;
}

export async function getDrawReplay(
	database: D1Database,
	cycleId: string
): Promise<BookclubDrawReplay | null> {
	const draw = await database
		.prepare(
			`SELECT c.id AS cycle_id, d.id AS draw_id, d.suggestion_id, d.drawn_at, d.tickets_json,
			        b.id AS book_id, b.title AS book_title, b.author AS book_author,
			        b.cover_url AS book_cover_url, b.started_at AS book_started_at,
			        b.completed_at AS book_completed_at
			 FROM bookclub_cycles AS c
			 INNER JOIN bookclub_draws AS d ON d.cycle_id = c.id
			 INNER JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE c.id = ? AND c.status = 'drawn'
			 LIMIT 1`
		)
		.bind(cycleId)
		.first<{
			cycle_id: string;
			draw_id: string;
			suggestion_id: string;
			drawn_at: string;
			tickets_json: string | null;
			book_id: string;
			book_title: string;
			book_author: string;
			book_cover_url: string | null;
			book_started_at: string | null;
			book_completed_at: string | null;
		}>();

	if (!draw) return null;

	// Older draws predate saved pools and retain their original full-poll replay.
	const suggestions = draw.tickets_json
		? (JSON.parse(draw.tickets_json) as BookclubSuggestion[])
		: await getCycleSuggestions(database, cycleId);
	const history = await database
		.prepare(
			`SELECT r.id, r.previous_title, r.previous_author, r.reason, r.rerolled_at, m.name
			 FROM bookclub_rerolls AS r
			 INNER JOIN bookclub_members AS m ON m.id = r.rerolled_by_member_id
			 WHERE r.cycle_id = ? ORDER BY r.rowid`
		)
		.bind(cycleId)
		.all<{
			id: string;
			previous_title: string;
			previous_author: string;
			reason: string;
			rerolled_at: string;
			name: string;
		}>();

	return {
		cycleId: draw.cycle_id,
		drawId: draw.draw_id,
		drawnAt: draw.drawn_at,
		winnerSuggestionId: draw.suggestion_id,
		book: {
			id: draw.book_id,
			title: draw.book_title,
			author: draw.book_author,
			coverUrl: draw.book_cover_url,
			startedAt: draw.book_started_at,
			completedAt: draw.book_completed_at
		},
		suggestions,
		rerolls: history.results.map((row) => ({
			id: row.id,
			previousTitle: row.previous_title,
			previousAuthor: row.previous_author,
			reason: row.reason,
			memberName: row.name,
			rerolledAt: row.rerolled_at
		}))
	};
}

export async function getBookPollSummaries(
	database: D1Database
): Promise<BookclubBookPollSummary[]> {
	const result = await database
		.prepare(
			`SELECT c.id, c.status, c.opened_at, c.closed_at,
			        b.id AS book_id, b.title AS book_title, b.author AS book_author,
			        b.cover_url AS book_cover_url, b.started_at AS book_started_at,
			        b.completed_at AS book_completed_at,
			        (SELECT COUNT(*) FROM bookclub_suggestions AS s WHERE s.cycle_id = c.id) AS suggestion_count,
			        (SELECT COUNT(*) FROM bookclub_reviews AS r WHERE r.book_id = b.id) AS review_count
			 FROM bookclub_cycles AS c
			 LEFT JOIN bookclub_books AS b ON b.id = c.book_id
			 ORDER BY c.created_at DESC, c.id DESC`
		)
		.all<BookPollSummaryRow>();

	return result.results.map(toBookPollSummary);
}

export async function deleteBookPoll(database: D1Database, cycleId: string): Promise<boolean> {
	const cycle = await database
		.prepare('SELECT id, book_id FROM bookclub_cycles WHERE id = ? LIMIT 1')
		.bind(cycleId)
		.first<{ id: string; book_id: string | null }>();

	if (!cycle) return false;

	const bookIsShared = cycle.book_id
		? `AND NOT EXISTS (
				SELECT 1 FROM bookclub_cycles WHERE book_id = ? AND id != ?
			)`
		: '';
	const bookBindings = cycle.book_id ? [cycle.book_id, cycle.id] : [];

	await database.batch([
		database
			.prepare(
				`DELETE FROM bookclub_reviews
				 WHERE book_id = ? ${bookIsShared}`
			)
			.bind(cycle.book_id, ...bookBindings),
		database.prepare('DELETE FROM bookclub_rerolls WHERE cycle_id = ?').bind(cycle.id),
		database.prepare('DELETE FROM bookclub_draws WHERE cycle_id = ?').bind(cycle.id),
		database.prepare('DELETE FROM bookclub_suggestions WHERE cycle_id = ?').bind(cycle.id),
		database.prepare('DELETE FROM bookclub_cycles WHERE id = ?').bind(cycle.id),
		database
			.prepare(
				`DELETE FROM bookclub_books
				 WHERE id = ?
				   AND NOT EXISTS (SELECT 1 FROM bookclub_cycles WHERE book_id = ?)
				   AND NOT EXISTS (SELECT 1 FROM bookclub_reviews WHERE book_id = ?)`
			)
			.bind(cycle.book_id, cycle.book_id, cycle.book_id),
		database.prepare(
			`UPDATE bookclub_books
				 SET completed_at = NULL
				 WHERE id = (
					 SELECT c.book_id FROM bookclub_cycles AS c
					 INNER JOIN bookclub_books AS b ON b.id = c.book_id
					 WHERE c.status = 'drawn' AND b.started_at IS NOT NULL
					 ORDER BY b.started_at DESC, c.created_at DESC, c.id DESC
					 LIMIT 1
				 ) AND NOT EXISTS (
					 SELECT 1 FROM bookclub_books AS active_book
					 INNER JOIN bookclub_cycles AS active_cycle ON active_cycle.book_id = active_book.id
					 WHERE active_cycle.status = 'drawn'
					   AND active_book.started_at IS NOT NULL AND active_book.completed_at IS NULL
				 )`
		)
	]);

	return true;
}

export async function createCycle(database: D1Database): Promise<number> {
	const sourceCycle = await database
		.prepare(
			`SELECT c.id, winner.title AS winner_title, winner.author AS winner_author
			 FROM bookclub_cycles AS c
			 INNER JOIN bookclub_draws AS d ON d.cycle_id = c.id
			 INNER JOIN bookclub_suggestions AS winner ON winner.id = d.suggestion_id
			 WHERE c.status = 'drawn'
			 ORDER BY c.created_at DESC, c.id DESC
			 LIMIT 1`
		)
		.first<CarryoverSourceRow>();

	const carryovers = sourceCycle
		? await database
				.prepare(
					`SELECT s.member_id, s.position, s.title, s.author
					 FROM bookclub_suggestions AS s
					 INNER JOIN bookclub_members AS m ON m.id = s.member_id
					 WHERE s.cycle_id = ? AND m.active = 1
					 ORDER BY s.member_id, s.position`
				)
				.bind(sourceCycle.id)
				.all<CarryoverSuggestionRow>()
		: { results: [] as CarryoverSuggestionRow[] };

	const suggestionsToCarry = carryovers.results.filter(
		(suggestion) =>
			!bookFieldMatches(suggestion.title, sourceCycle?.winner_title ?? '') ||
			!bookFieldMatches(suggestion.author, sourceCycle?.winner_author ?? '')
	);
	const cycleId = crypto.randomUUID();

	await database.batch([
		database
			.prepare(
				`INSERT INTO bookclub_cycles (id, status, suggestion_limit)
				 VALUES (?, 'open', ?)`
			)
			.bind(cycleId, SUGGESTION_LIMIT),
		...suggestionsToCarry.map((suggestion) =>
			database
				.prepare(
					`INSERT INTO bookclub_suggestions
					 (id, cycle_id, member_id, position, title, author)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					crypto.randomUUID(),
					cycleId,
					suggestion.member_id,
					suggestion.position,
					suggestion.title,
					suggestion.author
				)
		)
	]);

	return suggestionsToCarry.length;
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
	await assertSuggestionIsAvailable(database, cycleId, memberId, title, author, suggestionId);

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
		throw new Error('That book poll is no longer open.');
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

export async function reopenCycle(database: D1Database, cycleId: string): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_cycles SET status = 'open', closed_at = NULL WHERE id = ? AND status = 'closed'`
		)
		.bind(cycleId)
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
		throw new Error('This book poll is no longer open.');
	}
}

async function getCycleSuggestions(
	database: D1Database,
	cycleId: string
): Promise<BookclubSuggestion[]> {
	const rows = await database
		.prepare(
			`SELECT s.id, s.position, s.title, s.author, s.member_id, m.name AS member_name
		 FROM bookclub_suggestions AS s
		 INNER JOIN bookclub_members AS m ON m.id = s.member_id
		 WHERE s.cycle_id = ? ORDER BY s.id`
		)
		.bind(cycleId)
		.all<SuggestionRow>();
	return rows.results.map((row) => ({
		id: row.id,
		position: row.position,
		title: row.title,
		author: row.author,
		memberId: row.member_id,
		memberName: row.member_name
	}));
}

async function getWinnerCooldowns(
	database: D1Database,
	excludeCycleId = ''
): Promise<Map<string, number>> {
	// Updating a draw during a reroll preserves its rowid and its place in the poll sequence.
	const draws = await database
		.prepare(
			`SELECT s.member_id FROM bookclub_draws AS d
		 INNER JOIN bookclub_suggestions AS s ON s.id = d.suggestion_id
		 WHERE d.cycle_id != ? ORDER BY d.rowid DESC LIMIT ?`
		)
		.bind(excludeCycleId, WINNER_COOLDOWN_DRAWS)
		.all<{ member_id: string }>();
	const cooldowns = new Map<string, number>();
	draws.results.forEach((draw, index) => {
		if (!cooldowns.has(draw.member_id))
			cooldowns.set(draw.member_id, WINNER_COOLDOWN_DRAWS - index);
	});
	return cooldowns;
}

async function getEligibleSuggestions(
	database: D1Database,
	cycleId: string
): Promise<BookclubSuggestion[]> {
	const [suggestions, cooldowns, rejected, books] = await Promise.all([
		getCycleSuggestions(database, cycleId),
		getWinnerCooldowns(database, cycleId),
		database
			.prepare(
				'SELECT previous_title AS title, previous_author AS author FROM bookclub_rerolls WHERE cycle_id = ?'
			)
			.bind(cycleId)
			.all<{ title: string; author: string }>(),
		database
			.prepare('SELECT title, author FROM bookclub_books')
			.all<{ title: string; author: string }>()
	]);
	// A following poll may already contain carried tickets for a newly rerolled winner.
	// Check selected books here as well as on save so those copies cannot win again.
	const unavailable = [...rejected.results, ...books.results];
	return suggestions.filter(
		(suggestion) =>
			!cooldowns.has(suggestion.memberId) &&
			!unavailable.some(
				(book) =>
					bookFieldMatches(suggestion.title, book.title) &&
					bookFieldMatches(suggestion.author, book.author)
			)
	);
}

export async function rerollCycle(
	database: D1Database,
	cycleId: string,
	expectedDrawId: string,
	memberId: string,
	reason: string
): Promise<BookclubBook> {
	const admin = await database
		.prepare("SELECT id FROM bookclub_members WHERE id = ? AND role = 'admin' AND active = 1")
		.bind(memberId)
		.first();
	if (!admin) throw new Error('Only the club admin can reroll a book.');
	if (!reason.trim() || reason.trim().length > 300)
		throw new Error('Enter a reason between 1 and 300 characters.');
	const replay = await getDrawReplay(database, cycleId);
	if (!replay || replay.drawId !== expectedDrawId || replay.book.startedAt) {
		throw new Error('That result is no longer waiting for a reroll. Refresh the page.');
	}
	const suggestions = await getEligibleSuggestions(database, cycleId);
	if (!suggestions.length) throw new Error('No eligible alternatives remain for this poll.');
	const winner = suggestions[crypto.getRandomValues(new Uint32Array(1))[0] % suggestions.length];
	const bookId = crypto.randomUUID();
	const drawId = crypto.randomUUID();
	const claimed = 'SELECT 1 FROM bookclub_draws WHERE cycle_id = ? AND id = ?';
	// Claim the exact displayed result in the same transaction as the audit, replacement,
	// and announcement. A competing reroll or start makes the whole batch a no-op.
	const results = await database.batch([
		database
			.prepare(
				`INSERT INTO bookclub_rerolls
			 (id, cycle_id, previous_draw_id, previous_suggestion_id, previous_title, previous_author, reason, rerolled_by_member_id)
			 SELECT ?, d.cycle_id, d.id, d.suggestion_id, b.title, b.author, ?, ?
			 FROM bookclub_draws AS d
			 INNER JOIN bookclub_cycles AS c ON c.id = d.cycle_id
			 INNER JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE d.cycle_id = ? AND d.id = ? AND b.started_at IS NULL`
			)
			.bind(crypto.randomUUID(), reason.trim(), memberId, cycleId, expectedDrawId),
		database
			.prepare(
				`UPDATE bookclub_draws SET id = ?, suggestion_id = ?, drawn_by_member_id = ?,
			 drawn_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), tickets_json = ?
			 WHERE cycle_id = ? AND id = ? AND EXISTS (
			 SELECT 1 FROM bookclub_cycles AS c INNER JOIN bookclub_books AS b ON b.id = c.book_id
			 WHERE c.id = ? AND b.started_at IS NULL)`
			)
			.bind(
				drawId,
				winner.id,
				memberId,
				JSON.stringify(suggestions),
				cycleId,
				expectedDrawId,
				cycleId
			),
		database
			.prepare(
				`DELETE FROM bookclub_books WHERE id = ? AND started_at IS NULL AND EXISTS (${claimed})`
			)
			.bind(replay.book.id, cycleId, drawId),
		database
			.prepare(
				`INSERT INTO bookclub_books (id, title, author) SELECT ?, ?, ? WHERE EXISTS (${claimed})`
			)
			.bind(bookId, winner.title, winner.author, cycleId, drawId),
		database
			.prepare(`UPDATE bookclub_cycles SET book_id = ? WHERE id = ? AND EXISTS (${claimed})`)
			.bind(bookId, cycleId, cycleId, drawId),
		database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body, message_type)
			 SELECT ?, ?, ?, 'announcement' WHERE EXISTS (${claimed})`
			)
			.bind(
				crypto.randomUUID(),
				memberId,
				`BOOK REROLL: ${winner.title} by ${winner.author}. See the draw replay for the reason.`,
				cycleId,
				drawId
			)
	]);
	if (!results[1].meta.changes)
		throw new Error('That result is no longer waiting for a reroll. Refresh the page.');
	return {
		id: bookId,
		title: winner.title,
		author: winner.author,
		coverUrl: null,
		startedAt: null,
		completedAt: null
	};
}

export async function drawCycle(
	database: D1Database,
	cycleId: string,
	drawnByMemberId: string
): Promise<BookclubBook> {
	const cycle = await database
		.prepare(
			`SELECT id, status
			 FROM bookclub_cycles
			 WHERE id = ?
			 LIMIT 1`
		)
		.bind(cycleId)
		.first<{ id: string; status: BookclubCycle['status'] }>();

	if (!cycle || cycle.status === 'drawn') {
		throw new Error('This book poll is no longer available for drawing.');
	}

	if (cycle.status !== 'closed') {
		throw new Error('Close the book poll before drawing the next book.');
	}

	if (await getUpcomingCycle(database)) {
		throw new Error('Start the upcoming book before drawing another.');
	}

	const suggestions = await getEligibleSuggestions(database, cycleId);
	if (suggestions.length === 0) {
		throw new Error(
			'No eligible suggestions remain. Recent winners sit out two draws. Reopen suggestions to collect tickets from another member.'
		);
	}

	const winner = suggestions[crypto.getRandomValues(new Uint32Array(1))[0] % suggestions.length];
	const bookId = crypto.randomUUID();
	const now = new Date().toISOString();

	// A saved result reserves the book; reading dates belong to the separate start action.
	const results = await database.batch([
		database
			.prepare(
				`INSERT INTO bookclub_books (id, title, author)
				 SELECT ?, ?, ? WHERE EXISTS (
				 SELECT 1 FROM bookclub_cycles WHERE id = ? AND status = 'closed'
				 )`
			)
			.bind(bookId, winner.title, winner.author, cycleId),
		database
			.prepare(
				`UPDATE bookclub_cycles
					 SET status = 'drawn', book_id = ?, closed_at = COALESCE(closed_at, ?)
					 WHERE id = ? AND status = 'closed'`
			)
			.bind(bookId, now, cycleId),
		database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body, message_type)
			 SELECT ?, ?, ?, 'announcement' WHERE EXISTS (
			 SELECT 1 FROM bookclub_cycles WHERE id = ? AND status = 'drawn' AND book_id = ?)`
			)
			.bind(
				crypto.randomUUID(),
				drawnByMemberId,
				`UPCOMING BOOK: ${winner.title} by ${winner.author}. Time to find a copy!`,
				cycleId,
				bookId
			),
		database
			.prepare(
				`INSERT INTO bookclub_draws (id, cycle_id, suggestion_id, drawn_by_member_id, tickets_json)
				 SELECT ?, ?, ?, ?, ? WHERE EXISTS (
				 SELECT 1 FROM bookclub_cycles WHERE id = ? AND status = 'drawn' AND book_id = ?
				 )`
			)
			.bind(
				crypto.randomUUID(),
				cycleId,
				winner.id,
				drawnByMemberId,
				JSON.stringify(suggestions),
				cycleId,
				bookId
			)
	]);

	if (!results[3].meta.changes)
		throw new Error('This book poll is no longer available for drawing.');

	return {
		id: bookId,
		title: winner.title,
		author: winner.author,
		coverUrl: null,
		startedAt: null,
		completedAt: null
	};
}

export async function advanceBook(
	database: D1Database,
	cycleId: string,
	memberId: string,
	expectedBookId?: string
): Promise<boolean> {
	const now = new Date().toISOString();
	const pendingBook = `SELECT b.id FROM bookclub_books AS b
		INNER JOIN bookclub_cycles AS c ON c.book_id = b.id
		WHERE c.id = ? AND c.status = 'drawn' AND b.started_at IS NULL
		  AND (? IS NULL OR b.id = ?)`;

	// Every statement checks the submitted reservation in one atomic batch. Repeated
	// or stale submissions must neither finish another book nor announce it twice.
	const results = await database.batch([
		database
			.prepare(
				`UPDATE bookclub_books SET completed_at = ?
				 WHERE started_at IS NOT NULL AND completed_at IS NULL
				   AND EXISTS (${pendingBook})`
			)
			.bind(now, cycleId, expectedBookId ?? null, expectedBookId ?? null),
		database
			.prepare(
				`INSERT INTO bookclub_chat_messages (id, member_id, body, message_type)
				 SELECT ?, ?, 'CURRENT BOOK: ' || title || ' by ' || author || '.', 'announcement'
				 FROM bookclub_books WHERE id IN (${pendingBook})`
			)
			.bind(crypto.randomUUID(), memberId, cycleId, expectedBookId ?? null, expectedBookId ?? null),
		database
			.prepare(`UPDATE bookclub_books SET started_at = ? WHERE id IN (${pendingBook})`)
			.bind(now, cycleId, expectedBookId ?? null, expectedBookId ?? null)
	]);
	return Boolean(results[2].meta.changes);
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
