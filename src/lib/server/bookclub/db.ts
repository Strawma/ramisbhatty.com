import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

export type BookclubRole = 'member' | 'admin';

export interface BookclubMember {
	id: string;
	username: string;
	name: string;
	role: BookclubRole;
	chatColor: string;
}

/** Return the configured D1 binding or fail with a useful service error. */
export function getBookclubDatabase(): D1Database {
	// Adapter 8 exposes bindings through the Workers module in production and local previews.
	const database = env.BOOKCLUB_DB;

	if (!database) {
		throw error(503, 'The book club database is not available.');
	}

	return database;
}
