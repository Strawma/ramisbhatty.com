PRAGMA foreign_keys = ON;

CREATE TABLE bookclub_invitations (
	id TEXT PRIMARY KEY,
	purpose TEXT NOT NULL CHECK (purpose IN ('invite', 'reset')),
	token_hash TEXT NOT NULL UNIQUE,
	member_id TEXT REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	display_name TEXT,
	created_by_member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	expires_at TEXT NOT NULL,
	consumed_at TEXT,
	revoked_at TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	CHECK (
		(purpose = 'invite' AND member_id IS NULL AND display_name IS NOT NULL) OR
		(purpose = 'reset' AND member_id IS NOT NULL AND display_name IS NULL)
	)
);

CREATE INDEX bookclub_invitations_expiry_idx ON bookclub_invitations(expires_at);
CREATE INDEX bookclub_invitations_member_idx ON bookclub_invitations(member_id);
CREATE INDEX bookclub_invitations_created_idx ON bookclub_invitations(created_at);
