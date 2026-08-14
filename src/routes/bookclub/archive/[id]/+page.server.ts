import { error, fail } from '@sveltejs/kit';
import { requireBookclubMember } from '#lib/server/bookclub/auth';
import { getBookclubDatabase } from '#lib/server/bookclub/db';
import { getArchiveEntry } from '#lib/server/bookclub/cycles';
import { deleteOwnBookReview, getBookReviews, saveBookReview } from '#lib/server/bookclub/reviews';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({
		'cache-control': 'no-store',
		'referrer-policy': 'origin'
	});
	const member = await requireBookclubMember(event);

	const database = getBookclubDatabase(event.platform);
	const entry = await getArchiveEntry(database, event.params.id);
	if (!entry) throw error(404, 'That archived book could not be found.');
	const reviews = await getBookReviews(database, entry.book.id);

	return {
		member,
		entry,
		reviews,
		myReview: reviews.find((review) => review.memberId === member.id) ?? null
	};
};

export const actions: Actions = {
	saveReview: async (event) => {
		const member = await requireBookclubMember(event);
		const database = getBookclubDatabase(event.platform);
		const entry = await getArchiveEntry(database, event.params.id);
		if (!entry) return fail(404, { error: 'That archived book could not be found.' });

		const form = await event.request.formData();
		const ratingValue = form.get('rating');
		const bodyValue = form.get('body');
		const quoteValue = form.get('favouriteQuote');
		const verdictValue = form.get('verdict');
		const rating =
			typeof ratingValue === 'string' && ratingValue !== '' ? Number(ratingValue) : null;
		const body = typeof bodyValue === 'string' ? bodyValue.trim() : '';
		const favouriteQuote = typeof quoteValue === 'string' ? quoteValue.trim() : '';
		const verdict = typeof verdictValue === 'string' ? verdictValue.trim() : '';

		if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
			return fail(400, { error: 'Choose a rating from 1 to 5, or leave it unrated.' });
		}
		if (body.length > 4_000 || favouriteQuote.length > 1_000 || verdict.length > 120) {
			return fail(400, { error: 'One or more review fields are too long.' });
		}
		if (rating === null && !body && !favouriteQuote && !verdict) {
			return fail(400, { error: 'Add a rating, review, note, quote, or verdict before saving.' });
		}

		try {
			await saveBookReview(database, entry.book.id, member.id, {
				rating,
				body,
				favouriteQuote,
				spoiler: form.get('spoiler') === 'on',
				verdict
			});
		} catch (reviewError) {
			return fail(400, {
				error: reviewError instanceof Error ? reviewError.message : 'The review could not be saved.'
			});
		}

		return { success: 'Your review has been saved.' };
	},

	deleteReview: async (event) => {
		const member = await requireBookclubMember(event);
		const database = getBookclubDatabase(event.platform);
		const entry = await getArchiveEntry(database, event.params.id);
		if (!entry) return fail(404, { error: 'That archived book could not be found.' });

		if (!(await deleteOwnBookReview(database, entry.book.id, member.id))) {
			return fail(400, { error: 'You do not have a review to delete.' });
		}

		return { success: 'Your review has been deleted.' };
	}
};
