import type { D1Database } from '@cloudflare/workers-types';

export interface BookclubReview {
	id: string;
	bookId: string;
	memberId: string;
	memberName: string;
	memberChatColor: string;
	rating: number | null;
	body: string;
	favouriteQuote: string | null;
	spoiler: boolean;
	verdict: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface BookclubReviewInput {
	rating: number | null;
	body: string;
	favouriteQuote: string;
	spoiler: boolean;
	verdict: string;
}

interface ReviewRow {
	id: string;
	book_id: string;
	member_id: string;
	member_name: string;
	member_chat_color: string;
	rating: number | null;
	body: string;
	favourite_quote: string | null;
	spoiler: number;
	verdict: string | null;
	created_at: string;
	updated_at: string;
}

function toReview(row: ReviewRow): BookclubReview {
	return {
		id: row.id,
		bookId: row.book_id,
		memberId: row.member_id,
		memberName: row.member_name,
		memberChatColor: row.member_chat_color,
		rating: row.rating,
		body: row.body,
		favouriteQuote: row.favourite_quote,
		spoiler: Boolean(row.spoiler),
		verdict: row.verdict,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export async function getBookReviews(
	database: D1Database,
	bookId: string
): Promise<BookclubReview[]> {
	const result = await database
		.prepare(
			`SELECT r.id, r.book_id, r.member_id, m.name AS member_name,
			        m.chat_color AS member_chat_color, r.rating, r.body,
			        r.favourite_quote, r.spoiler, r.verdict, r.created_at, r.updated_at
			 FROM bookclub_reviews AS r
			 INNER JOIN bookclub_members AS m ON m.id = r.member_id
			 WHERE r.book_id = ?
			 ORDER BY r.updated_at, r.id`
		)
		.bind(bookId)
		.all<ReviewRow>();

	return result.results.map(toReview);
}

async function assertBookIsArchived(database: D1Database, bookId: string): Promise<void> {
	const archivedBook = await database
		.prepare(
			`SELECT b.id
			 FROM bookclub_books AS b
			 INNER JOIN bookclub_cycles AS c ON c.book_id = b.id
			 WHERE b.id = ? AND b.completed_at IS NOT NULL AND c.status = 'drawn'
			   AND c.id != COALESCE(
				   (SELECT id FROM bookclub_cycles
				    WHERE status = 'drawn'
				    ORDER BY created_at DESC, id DESC
				    LIMIT 1),
				   ''
			   )
			 LIMIT 1`
		)
		.bind(bookId)
		.first<{ id: string }>();

	if (!archivedBook) throw new Error('Reviews are available only for completed archived books.');
}

export async function saveBookReview(
	database: D1Database,
	bookId: string,
	memberId: string,
	input: BookclubReviewInput
): Promise<void> {
	await assertBookIsArchived(database, bookId);

	await database
		.prepare(
			`INSERT INTO bookclub_reviews
			 (id, book_id, member_id, rating, body, favourite_quote, spoiler, verdict)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(book_id, member_id) DO UPDATE SET
			   rating = excluded.rating,
			   body = excluded.body,
			   favourite_quote = excluded.favourite_quote,
			   spoiler = excluded.spoiler,
			   verdict = excluded.verdict,
			   updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
		)
		.bind(
			crypto.randomUUID(),
			bookId,
			memberId,
			input.rating,
			input.body,
			input.favouriteQuote || null,
			input.spoiler ? 1 : 0,
			input.verdict || null
		)
		.run();
}

export async function deleteOwnBookReview(
	database: D1Database,
	bookId: string,
	memberId: string
): Promise<boolean> {
	const result = await database
		.prepare('DELETE FROM bookclub_reviews WHERE book_id = ? AND member_id = ?')
		.bind(bookId, memberId)
		.run();

	return Boolean(result.meta.changes);
}
