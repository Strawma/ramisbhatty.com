PRAGMA foreign_keys = ON;

CREATE TABLE bookclub_meetings (
	id TEXT PRIMARY KEY,
	scheduled_for TEXT NOT NULL,
	note TEXT,
	scheduled_by_member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX bookclub_meetings_schedule_idx ON bookclub_meetings(scheduled_for);

CREATE TABLE bookclub_chat_messages (
	id TEXT PRIMARY KEY,
	member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX bookclub_chat_messages_created_idx ON bookclub_chat_messages(created_at);
CREATE INDEX bookclub_chat_messages_member_idx ON bookclub_chat_messages(member_id);

CREATE UNIQUE INDEX bookclub_one_open_cycle_idx
	ON bookclub_cycles(status)
	WHERE status = 'open';
