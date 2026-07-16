import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { getBookclubDatabase, type BookclubMember } from './db';

export const BOOKCLUB_SESSION_COOKIE = 'bookclub_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 14;
const INVITE_HASH_ITERATIONS = 120_000;
const MAX_INVITE_HASH_ITERATIONS = 1_000_000;

interface StoredMember extends BookclubMember {
	invite_code_hash: string;
}

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array {
	const base64 =
		value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return encodeBase64Url(new Uint8Array(digest));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
	let difference = left.length ^ right.length;
	const length = Math.max(left.length, right.length);

	for (let index = 0; index < length; index += 1) {
		difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
	}

	return difference === 0;
}

export async function hashInviteCode(inviteCode: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(inviteCode),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	const derived = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt.buffer as ArrayBuffer,
			iterations: INVITE_HASH_ITERATIONS,
			hash: 'SHA-256'
		},
		key,
		256
	);

	return `pbkdf2-sha256$${INVITE_HASH_ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(new Uint8Array(derived))}`;
}

async function verifyInviteCode(inviteCode: string, encodedHash: string): Promise<boolean> {
	const [algorithm, iterationsValue, saltValue, digestValue] = encodedHash.split('$');
	const iterations = Number(iterationsValue);

	if (
		algorithm !== 'pbkdf2-sha256' ||
		!Number.isSafeInteger(iterations) ||
		iterations <= 0 ||
		iterations > MAX_INVITE_HASH_ITERATIONS ||
		!saltValue ||
		!digestValue
	) {
		return false;
	}

	try {
		const salt = decodeBase64Url(saltValue);
		const expected = decodeBase64Url(digestValue);
		const key = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(inviteCode),
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);
		const derived = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt.buffer as ArrayBuffer,
				iterations,
				hash: 'SHA-256'
			},
			key,
			256
		);
		const actual = new Uint8Array(derived);
		const matches = constantTimeEqual(actual, expected);

		if (!matches) {
			console.warn('Book club invite digest mismatch', {
				saltLength: salt.length,
				expectedLength: expected.length,
				actualLength: actual.length,
				expectedPrefix: encodeBase64Url(expected).slice(0, 12),
				actualPrefix: encodeBase64Url(actual).slice(0, 12)
			});
		}

		return matches;
	} catch (error) {
		console.warn('Book club invite verification crypto failed', {
			errorName: error instanceof Error ? error.name : 'unknown',
			errorMessage: error instanceof Error ? error.message : String(error)
		});
		return false;
	}
}

export async function findMemberByInviteCode(
	database: D1Database,
	inviteCode: string
): Promise<BookclubMember | null> {
	const members = await database
		.prepare(
			`SELECT id, name, role, invite_code_hash
			 FROM bookclub_members
			 WHERE active = 1`
		)
		.all<StoredMember>();

	let match: BookclubMember | null = null;

	for (const member of members.results) {
		if (await verifyInviteCode(inviteCode, member.invite_code_hash)) {
			match = { id: member.id, name: member.name, role: member.role };
		}
	}

	if (!match) {
		console.warn('Book club invite lookup failed', {
			activeMemberCount: members.results.length,
			inviteCodeLength: inviteCode.length,
			firstCodePoint: inviteCode.codePointAt(0),
			lastCodePoint: inviteCode.codePointAt(inviteCode.length - 1),
			hashFormats: members.results.map((member) =>
				member.invite_code_hash.split('$').slice(0, 2).join('$')
			)
		});
	}

	return match;
}

export async function createSession(database: D1Database, memberId: string): Promise<string> {
	const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
	const tokenHash = await sha256(token);
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000).toISOString();

	await database
		.prepare(
			`INSERT INTO bookclub_sessions (id, member_id, token_hash, expires_at)
			 VALUES (?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), memberId, tokenHash, expiresAt)
		.run();

	return token;
}

export async function getSessionMember(event: RequestEvent): Promise<BookclubMember | null> {
	const token = event.cookies.get(BOOKCLUB_SESSION_COOKIE);

	if (!token) {
		return null;
	}

	const database = getBookclubDatabase(event.platform);
	const tokenHash = await sha256(token);
	const now = new Date().toISOString();
	const result = await database
		.prepare(
			`SELECT m.id, m.name, m.role
			 FROM bookclub_sessions AS s
			 INNER JOIN bookclub_members AS m ON m.id = s.member_id
			 WHERE s.token_hash = ?
			   AND s.expires_at > ?
			   AND m.active = 1
			 LIMIT 1`
		)
		.bind(tokenHash, now)
		.first<BookclubMember>();

	if (!result) {
		await database
			.prepare('DELETE FROM bookclub_sessions WHERE token_hash = ?')
			.bind(tokenHash)
			.run();
		return null;
	}

	return result;
}

export async function deleteSession(database: D1Database, token: string): Promise<void> {
	const tokenHash = await sha256(token);
	await database
		.prepare('DELETE FROM bookclub_sessions WHERE token_hash = ?')
		.bind(tokenHash)
		.run();
}

export async function requireBookclubMember(event: RequestEvent): Promise<BookclubMember> {
	const member = await getSessionMember(event);

	if (!member) {
		throw redirect(303, '/bookclub/login');
	}

	return member;
}
