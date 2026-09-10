-- A draw reserves the next book until an administrator starts it. Enforce the
-- single reservation in the database so concurrent draws cannot queue two books.
CREATE UNIQUE INDEX bookclub_one_upcoming_book_idx
	ON bookclub_books ((1))
	WHERE started_at IS NULL;
