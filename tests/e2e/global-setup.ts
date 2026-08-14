import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATABASE_NAME = 'ramis-bookclub';
const MEMBER_IDS = ['bookclub-e2e-alice', 'bookclub-e2e-bob'] as const;
const DRAW_FIXTURE = {
	archiveBookId: 'bookclub-e2e-archive-book',
	archiveCycleId: 'bookclub-e2e-archive-cycle',
	archiveDrawId: 'bookclub-e2e-archive-draw',
	archiveSuggestionId: 'bookclub-e2e-archive-suggestion',
	currentBookId: 'bookclub-e2e-current-book',
	currentCycleId: 'bookclub-e2e-current-cycle',
	currentDrawId: 'bookclub-e2e-current-draw',
	currentSuggestionIds: ['bookclub-e2e-current-suggestion-a', 'bookclub-e2e-current-suggestion-b']
} as const;

function runWrangler(args: string[]): void {
	execFileSync('pnpm', ['exec', 'wrangler', ...args], {
		cwd: process.cwd(),
		stdio: 'inherit',
		env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }
	});
}

function executeLocalSql(sql: string): void {
	runWrangler(['d1', 'execute', DATABASE_NAME, '--local', '--command', sql]);
}

function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('base64url');
}

function cleanupTestMembers(): void {
	const memberList = MEMBER_IDS.map((id) => `'${id}'`).join(', ');
	const fixtureCycleList = `'${DRAW_FIXTURE.archiveCycleId}', '${DRAW_FIXTURE.currentCycleId}'`;
	const fixtureBookList = `'${DRAW_FIXTURE.archiveBookId}', '${DRAW_FIXTURE.currentBookId}'`;
	executeLocalSql(
		`DELETE FROM bookclub_chat_messages WHERE member_id IN (${memberList});
		 DELETE FROM bookclub_reviews WHERE member_id IN (${memberList});
		 DELETE FROM bookclub_draws WHERE cycle_id IN (${fixtureCycleList});
		 DELETE FROM bookclub_suggestions WHERE member_id IN (${memberList});
		 DELETE FROM bookclub_cycles WHERE id IN (${fixtureCycleList});
		 DELETE FROM bookclub_books WHERE id IN (${fixtureBookList});
		 DELETE FROM bookclub_sessions WHERE member_id IN (${memberList});
		 DELETE FROM bookclub_members WHERE id IN (${memberList})`
	);
}

export default async function globalSetup(): Promise<() => void> {
	runWrangler(['d1', 'migrations', 'apply', DATABASE_NAME, '--local']);
	cleanupTestMembers();

	const aliceToken = randomBytes(32).toString('base64url');
	const bobToken = randomBytes(32).toString('base64url');
	const sessionFile = join(tmpdir(), `ramis-bookclub-e2e-${process.pid}.json`);

	executeLocalSql(
		`INSERT INTO bookclub_members (id, username, name, role, invite_code_hash, chat_color)
		 VALUES
		 ('${MEMBER_IDS[0]}', 'e2e-alice', 'E2E Alice', 'admin', 'e2e-hash-alice', '#22d3ee'),
		 ('${MEMBER_IDS[1]}', 'e2e-bob', 'E2E Bob', 'member', 'e2e-hash-bob', '#f472b6');
		 INSERT INTO bookclub_sessions (id, member_id, token_hash, expires_at)
		 VALUES
		 ('bookclub-e2e-session-alice', '${MEMBER_IDS[0]}', '${hashSessionToken(aliceToken)}', '2099-01-01T00:00:00.000Z'),
		 ('bookclub-e2e-session-bob', '${MEMBER_IDS[1]}', '${hashSessionToken(bobToken)}', '2099-01-01T00:00:00.000Z')`
	);

	executeLocalSql(
		`INSERT INTO bookclub_books (id, title, author, started_at, completed_at, created_at)
		 VALUES
		 ('${DRAW_FIXTURE.archiveBookId}', 'Archived Browser Book', 'Archive Author', '2097-01-01T00:00:00.000Z', '2098-01-01T00:00:00.000Z', '2097-01-01T00:00:00.000Z'),
		 ('${DRAW_FIXTURE.currentBookId}', 'Current Browser Book', 'Current Author', '2099-01-01T00:00:00.000Z', NULL, '2099-01-01T00:00:00.000Z');
		 INSERT INTO bookclub_cycles (id, status, book_id, opened_at, closed_at, created_at)
		 VALUES
		 ('${DRAW_FIXTURE.archiveCycleId}', 'drawn', '${DRAW_FIXTURE.archiveBookId}', '2097-01-01T00:00:00.000Z', '2097-01-02T00:00:00.000Z', '2097-01-01T00:00:00.000Z'),
		 ('${DRAW_FIXTURE.currentCycleId}', 'drawn', '${DRAW_FIXTURE.currentBookId}', '2099-01-01T00:00:00.000Z', '2099-01-02T00:00:00.000Z', '2099-01-01T00:00:00.000Z');
		 INSERT INTO bookclub_suggestions (id, cycle_id, member_id, position, title, author)
		 VALUES
		 ('${DRAW_FIXTURE.archiveSuggestionId}', '${DRAW_FIXTURE.archiveCycleId}', '${MEMBER_IDS[0]}', 1, 'Archived Browser Book', 'Archive Author'),
		 ('${DRAW_FIXTURE.currentSuggestionIds[0]}', '${DRAW_FIXTURE.currentCycleId}', '${MEMBER_IDS[0]}', 1, 'Current Browser Book', 'Current Author'),
		 ('${DRAW_FIXTURE.currentSuggestionIds[1]}', '${DRAW_FIXTURE.currentCycleId}', '${MEMBER_IDS[1]}', 1, 'Alternative Browser Book', 'Alternative Author');
		 INSERT INTO bookclub_draws (id, cycle_id, suggestion_id, drawn_by_member_id, drawn_at)
		 VALUES
		 ('${DRAW_FIXTURE.archiveDrawId}', '${DRAW_FIXTURE.archiveCycleId}', '${DRAW_FIXTURE.archiveSuggestionId}', '${MEMBER_IDS[0]}', '2097-01-02T00:00:00.000Z'),
		 ('${DRAW_FIXTURE.currentDrawId}', '${DRAW_FIXTURE.currentCycleId}', '${DRAW_FIXTURE.currentSuggestionIds[0]}', '${MEMBER_IDS[0]}', '2099-01-02T00:00:00.000Z')`
	);

	writeFileSync(sessionFile, JSON.stringify({ aliceToken, bobToken }), {
		encoding: 'utf8',
		mode: 0o600
	});
	process.env.BOOKCLUB_E2E_SESSION_FILE = sessionFile;

	return () => {
		cleanupTestMembers();
		unlinkSync(sessionFile);
	};
}
