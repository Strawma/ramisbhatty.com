PRAGMA foreign_keys = ON;

ALTER TABLE bookclub_members ADD COLUMN last_seen_at TEXT;

CREATE INDEX bookclub_members_last_seen_idx ON bookclub_members(last_seen_at);
