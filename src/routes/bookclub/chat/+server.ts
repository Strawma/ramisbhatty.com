import { json } from '@sveltejs/kit';
import { requireBookclubMember } from '#lib/server/bookclub/auth.ts';
import { getChatroomState } from '#lib/server/bookclub/chat.ts';
import { getBookclubDatabase } from '#lib/server/bookclub/db.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'no-store' });
	const member = await requireBookclubMember(event);
	const state = await getChatroomState(getBookclubDatabase(), member.id);

	return json(state);
};
