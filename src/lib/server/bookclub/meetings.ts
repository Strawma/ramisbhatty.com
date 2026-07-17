import type { D1Database } from '@cloudflare/workers-types';

export interface BookclubMeeting {
	id: string;
	scheduledFor: string;
	note: string | null;
}

interface MeetingRow {
	id: string;
	scheduled_for: string;
	note: string | null;
}

function toMeeting(row: MeetingRow | null): BookclubMeeting | null {
	if (!row) return null;

	return {
		id: row.id,
		scheduledFor: row.scheduled_for,
		note: row.note
	};
}

export async function getNextMeeting(database: D1Database): Promise<BookclubMeeting | null> {
	const meeting = await database
		.prepare(
			`SELECT id, scheduled_for, note
			 FROM bookclub_meetings
			 WHERE scheduled_for > ?
			 ORDER BY scheduled_for
			 LIMIT 1`
		)
		.bind(new Date().toISOString())
		.first<MeetingRow>();

	return toMeeting(meeting);
}

export async function scheduleNextMeeting(
	database: D1Database,
	memberId: string,
	scheduledFor: string,
	note: string | null
): Promise<void> {
	await database.batch([
		database.prepare('DELETE FROM bookclub_meetings'),
		database
			.prepare(
				`INSERT INTO bookclub_meetings (id, scheduled_for, note, scheduled_by_member_id)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), scheduledFor, note, memberId)
	]);
}

export async function clearNextMeeting(database: D1Database): Promise<void> {
	await database.prepare('DELETE FROM bookclub_meetings').run();
}
