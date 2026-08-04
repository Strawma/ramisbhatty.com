import { dev } from '$app/env';
import { error, redirect } from '@sveltejs/kit';
import { createSession, setBookclubSessionCookie } from '#lib/server/bookclub/auth';
import { getBookclubDatabase } from '#lib/server/bookclub/db';
import type { PageServerLoad } from './$types';

const PREVIEW_MEMBER_ID = 'local-preview-member';
const PREVIEW_INVITE_HASH = 'local-preview-session-only';

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	);
}

export const load: PageServerLoad = async (event) => {
	if (!dev || !isLoopbackHost(event.url.hostname)) {
		throw error(404, 'Not found');
	}

	const database = getBookclubDatabase(event.platform);
	await database
		.prepare(
			`INSERT INTO bookclub_members (id, username, name, invite_code_hash, role, chat_color)
			 VALUES (?, ?, ?, ?, 'admin', ?)
			 ON CONFLICT(id) DO UPDATE SET
				username = excluded.username,
				name = excluded.name,
				role = excluded.role,
				active = 1,
				chat_color = excluded.chat_color`
		)
		.bind(PREVIEW_MEMBER_ID, 'local-preview', 'Local Preview', PREVIEW_INVITE_HASH, '#22d3ee')
		.run();

	await database
		.prepare('DELETE FROM bookclub_sessions WHERE member_id = ?')
		.bind(PREVIEW_MEMBER_ID)
		.run();

	const token = await createSession(database, PREVIEW_MEMBER_ID);
	setBookclubSessionCookie(event, token);

	throw redirect(303, '/bookclub');
};
