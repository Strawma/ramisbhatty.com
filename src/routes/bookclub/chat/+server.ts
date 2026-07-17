import { json } from '@sveltejs/kit';
import { requireBookclubMember } from '$lib/server/bookclub/auth';
import { getChatMessages } from '$lib/server/bookclub/chat';
import { getBookclubDatabase } from '$lib/server/bookclub/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const messages = await getChatMessages(getBookclubDatabase(event.platform), member.id);

	return json(messages);
};
