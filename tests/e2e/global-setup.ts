import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATABASE_NAME = 'ramis-bookclub';
const MEMBER_IDS = ['bookclub-e2e-alice', 'bookclub-e2e-bob'] as const;

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
	executeLocalSql(
		`DELETE FROM bookclub_chat_messages WHERE member_id IN (${memberList});
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
		 ('${MEMBER_IDS[0]}', 'e2e-alice', 'E2E Alice', 'member', 'e2e-hash-alice', '#22d3ee'),
		 ('${MEMBER_IDS[1]}', 'e2e-bob', 'E2E Bob', 'member', 'e2e-hash-bob', '#f472b6');
		 INSERT INTO bookclub_sessions (id, member_id, token_hash, expires_at)
		 VALUES
		 ('bookclub-e2e-session-alice', '${MEMBER_IDS[0]}', '${hashSessionToken(aliceToken)}', '2099-01-01T00:00:00.000Z'),
		 ('bookclub-e2e-session-bob', '${MEMBER_IDS[1]}', '${hashSessionToken(bobToken)}', '2099-01-01T00:00:00.000Z')`
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
