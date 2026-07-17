PRAGMA foreign_keys = ON;

ALTER TABLE bookclub_members ADD COLUMN username TEXT;

UPDATE bookclub_members
SET username = 'member-' || lower(substr(id, 1, 8))
WHERE username IS NULL;

CREATE UNIQUE INDEX bookclub_members_username_idx ON bookclub_members(username);

ALTER TABLE bookclub_invitations ADD COLUMN username TEXT;

UPDATE bookclub_invitations
SET revoked_at = COALESCE(revoked_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
WHERE purpose = 'invite' AND consumed_at IS NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX bookclub_invitations_username_idx
	ON bookclub_invitations(username)
	WHERE username IS NOT NULL AND consumed_at IS NULL AND revoked_at IS NULL;
