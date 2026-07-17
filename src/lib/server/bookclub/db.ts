import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

export type BookclubRole = 'member' | 'admin';

export interface BookclubMember {
	id: string;
	username: string;
	name: string;
	role: BookclubRole;
}

/** Return the configured D1 binding or fail with a useful service error. */
export function getBookclubDatabase(platform: App.Platform | undefined): D1Database {
	const database = platform?.env.BOOKCLUB_DB;

	if (!database) {
		throw error(503, 'The book club database is not available.');
	}

	return database;
}
