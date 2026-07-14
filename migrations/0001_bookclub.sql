PRAGMA foreign_keys = ON;

CREATE TABLE bookclub_members (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	invite_code_hash TEXT NOT NULL UNIQUE,
	role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
	active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE bookclub_sessions (
	id TEXT PRIMARY KEY,
	member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX bookclub_sessions_member_idx ON bookclub_sessions(member_id);
CREATE INDEX bookclub_sessions_expiry_idx ON bookclub_sessions(expires_at);

CREATE TABLE bookclub_books (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	cover_url TEXT,
	started_at TEXT,
	completed_at TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE bookclub_cycles (
	id TEXT PRIMARY KEY,
	label TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'drawn')),
	suggestion_limit INTEGER NOT NULL DEFAULT 3 CHECK (suggestion_limit > 0),
	book_id TEXT REFERENCES bookclub_books(id) ON DELETE SET NULL,
	opened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	closed_at TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE bookclub_suggestions (
	id TEXT PRIMARY KEY,
	cycle_id TEXT NOT NULL REFERENCES bookclub_cycles(id) ON DELETE RESTRICT,
	member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE (cycle_id, member_id, position)
);

CREATE INDEX bookclub_suggestions_cycle_idx ON bookclub_suggestions(cycle_id);
CREATE INDEX bookclub_suggestions_member_idx ON bookclub_suggestions(member_id);

CREATE TABLE bookclub_draws (
	id TEXT PRIMARY KEY,
	cycle_id TEXT NOT NULL UNIQUE REFERENCES bookclub_cycles(id) ON DELETE RESTRICT,
	suggestion_id TEXT NOT NULL REFERENCES bookclub_suggestions(id) ON DELETE RESTRICT,
	drawn_by_member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	drawn_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE bookclub_reviews (
	id TEXT PRIMARY KEY,
	book_id TEXT NOT NULL REFERENCES bookclub_books(id) ON DELETE RESTRICT,
	member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	rating INTEGER CHECK (rating BETWEEN 1 AND 5),
	body TEXT NOT NULL,
	favourite_quote TEXT,
	spoiler INTEGER NOT NULL DEFAULT 0 CHECK (spoiler IN (0, 1)),
	verdict TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE (book_id, member_id)
);

CREATE INDEX bookclub_reviews_book_idx ON bookclub_reviews(book_id);
CREATE INDEX bookclub_reviews_member_idx ON bookclub_reviews(member_id);
