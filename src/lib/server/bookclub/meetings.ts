import type { D1Database } from '@cloudflare/workers-types';
import { prepareChatAnnouncement } from './chat';

export const MEETING_RECURRENCE_MS = 14 * 24 * 60 * 60 * 1000;

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

interface PastMeetingRow extends MeetingRow {
	scheduled_by_member_id: string;
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
	const previousMeeting = await getNextMeeting(database);
	const changed =
		!previousMeeting ||
		previousMeeting.scheduledFor !== scheduledFor ||
		previousMeeting.note !== note;

	await database.batch([
		database.prepare('DELETE FROM bookclub_meetings'),
		database
			.prepare(
				`INSERT INTO bookclub_meetings (id, scheduled_for, note, scheduled_by_member_id)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), scheduledFor, note, memberId),
		...(changed
			? [
					prepareChatAnnouncement(
						database,
						memberId,
						`MEETING UPDATED: ${new Date(scheduledFor).toISOString()}${note ? ` (${note})` : ''}`
					)
				]
			: [])
	]);
}

export async function clearNextMeeting(database: D1Database, memberId?: string): Promise<void> {
	const previousMeeting = await database
		.prepare('SELECT id, scheduled_for, note FROM bookclub_meetings LIMIT 1')
		.first<MeetingRow>();

	if (!previousMeeting) return;

	await database.batch([
		database.prepare('DELETE FROM bookclub_meetings'),
		...(memberId
			? [
					prepareChatAnnouncement(
						database,
						memberId,
						`MEETING CANCELLED: The meeting scheduled for ${previousMeeting.scheduled_for} was cleared.`
					)
				]
			: [])
	]);
}

// Meetings repeat on a fixed two-week rhythm, so a meeting whose time has passed is
// rolled forward whole two-week periods until it lands in the future. This keeps the
// stored UTC clock time identical, which matches how the schedule form records it.
export async function reschedulePastMeetings(
	database: D1Database,
	now = new Date()
): Promise<void> {
	const pastMeetings = await database
		.prepare(
			`SELECT id, scheduled_for, note, scheduled_by_member_id
			 FROM bookclub_meetings
			 WHERE scheduled_for <= ?`
		)
		.bind(now.toISOString())
		.all<PastMeetingRow>();

	if (pastMeetings.results.length === 0) return;

	const statements = pastMeetings.results.flatMap((meeting) => {
		const scheduledTime = new Date(meeting.scheduled_for).getTime();
		const periodsSince = Math.floor((now.getTime() - scheduledTime) / MEETING_RECURRENCE_MS);
		const nextScheduledFor = new Date(
			scheduledTime + (periodsSince + 1) * MEETING_RECURRENCE_MS
		).toISOString();

		return [
			database
				.prepare('UPDATE bookclub_meetings SET scheduled_for = ? WHERE id = ?')
				.bind(nextScheduledFor, meeting.id),
			prepareChatAnnouncement(
				database,
				meeting.scheduled_by_member_id,
				`MEETING UPDATED: ${nextScheduledFor}${meeting.note ? ` (${meeting.note})` : ''} (auto-rescheduled)`
			)
		];
	});

	await database.batch(statements);
}
