import { redirect } from '@sveltejs/kit';
import { BOOKCLUB_SESSION_COOKIE, deleteSession } from '$lib/server/bookclub/auth';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(BOOKCLUB_SESSION_COOKIE);

	if (token) {
		await deleteSession(getBookclubDatabase(event.platform), token);
	}

	event.cookies.delete(BOOKCLUB_SESSION_COOKIE, { path: '/bookclub' });
	throw redirect(303, '/bookclub/login');
};
