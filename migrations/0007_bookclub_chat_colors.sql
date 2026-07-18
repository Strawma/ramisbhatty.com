PRAGMA foreign_keys = ON;

ALTER TABLE bookclub_members ADD COLUMN chat_color TEXT NOT NULL DEFAULT '#22d3ee'
	CHECK (length(chat_color) = 7 AND substr(chat_color, 1, 1) = '#');

WITH ordered_members AS (
	SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at, id) - 1) % 12 AS color_index
	FROM bookclub_members
)
UPDATE bookclub_members
SET chat_color = CASE (
	SELECT color_index FROM ordered_members WHERE ordered_members.id = bookclub_members.id
)
	WHEN 0 THEN '#22d3ee'
	WHEN 1 THEN '#f472b6'
	WHEN 2 THEN '#a3e635'
	WHEN 3 THEN '#facc15'
	WHEN 4 THEN '#fb923c'
	WHEN 5 THEN '#c084fc'
	WHEN 6 THEN '#2dd4bf'
	WHEN 7 THEN '#fb7185'
	WHEN 8 THEN '#60a5fa'
	WHEN 9 THEN '#bef264'
	WHEN 10 THEN '#e879f9'
	WHEN 11 THEN '#fbbf24'
	END;

CREATE INDEX bookclub_members_chat_color_idx ON bookclub_members(chat_color);
