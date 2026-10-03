-- Persist the eligible pool so later cooldown changes cannot alter a saved replay.
ALTER TABLE bookclub_draws ADD COLUMN tickets_json TEXT;

CREATE TABLE bookclub_rerolls (
	id TEXT PRIMARY KEY,
	cycle_id TEXT NOT NULL REFERENCES bookclub_cycles(id) ON DELETE CASCADE,
	previous_draw_id TEXT NOT NULL,
	previous_suggestion_id TEXT NOT NULL REFERENCES bookclub_suggestions(id) ON DELETE RESTRICT,
	previous_title TEXT NOT NULL,
	previous_author TEXT NOT NULL,
	reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 300),
	rerolled_by_member_id TEXT NOT NULL REFERENCES bookclub_members(id) ON DELETE RESTRICT,
	rerolled_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE (cycle_id, previous_draw_id)
);

CREATE INDEX bookclub_rerolls_cycle_idx ON bookclub_rerolls(cycle_id);
