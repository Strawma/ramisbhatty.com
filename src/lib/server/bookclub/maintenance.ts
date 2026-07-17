import type { D1Database } from '@cloudflare/workers-types';
import { CHAT_RETENTION_MS } from './chat';

const INVITATION_DISPLAY_LIMIT = 50;

export async function cleanupBookclubData(database: D1Database, now = new Date()): Promise<void> {
	const currentTime = now.toISOString();
	const chatCutoff = new Date(now.getTime() - CHAT_RETENTION_MS).toISOString();

	await database.batch([
		database.prepare('DELETE FROM bookclub_chat_messages WHERE created_at < ?').bind(chatCutoff),
		database.prepare('DELETE FROM bookclub_sessions WHERE expires_at <= ?').bind(currentTime),
		database.prepare('DELETE FROM bookclub_meetings WHERE scheduled_for <= ?').bind(currentTime),
		database
			.prepare(
				`DELETE FROM bookclub_invitations
				 WHERE (consumed_at IS NOT NULL OR revoked_at IS NOT NULL OR expires_at <= ?)
				   AND id NOT IN (
					   SELECT id
					   FROM bookclub_invitations
					   WHERE consumed_at IS NOT NULL OR revoked_at IS NOT NULL OR expires_at <= ?
					   ORDER BY created_at DESC
					   LIMIT ?
				   )`
			)
			.bind(currentTime, currentTime, INVITATION_DISPLAY_LIMIT)
	]);
}

export async function cleanupBookclubDataAfterLogin(database: D1Database): Promise<void> {
	try {
		await cleanupBookclubData(database);
	} catch {
		// Maintenance should not prevent a valid member from entering the clubhouse.
	}
}
