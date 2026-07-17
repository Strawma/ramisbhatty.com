import type { D1Database } from '@cloudflare/workers-types';

const CHAT_MESSAGE_LIMIT = 50;
const CHAT_MESSAGE_COOLDOWN_MS = 5_000;

export interface BookclubChatMessage {
	id: string;
	memberId: string;
	memberName: string;
	body: string;
	createdAt: string;
	isOwn: boolean;
}

interface ChatMessageRow {
	id: string;
	member_id: string;
	member_name: string;
	body: string;
	created_at: string;
}

export async function getChatMessages(
	database: D1Database,
	memberId: string
): Promise<BookclubChatMessage[]> {
	const messages = await database
		.prepare(
			`SELECT chat.id, chat.member_id, members.name AS member_name, chat.body, chat.created_at
			 FROM bookclub_chat_messages AS chat
			 INNER JOIN bookclub_members AS members ON members.id = chat.member_id
			 ORDER BY chat.created_at DESC
			 LIMIT ?`
		)
		.bind(CHAT_MESSAGE_LIMIT)
		.all<ChatMessageRow>();

	return messages.results.reverse().map((message) => ({
		id: message.id,
		memberId: message.member_id,
		memberName: message.member_name,
		body: message.body,
		createdAt: message.created_at,
		isOwn: message.member_id === memberId
	}));
}

export async function createChatMessage(
	database: D1Database,
	memberId: string,
	body: string
): Promise<void> {
	const cooldownSince = new Date(Date.now() - CHAT_MESSAGE_COOLDOWN_MS).toISOString();
	const recentMessage = await database
		.prepare(
			`SELECT id
			 FROM bookclub_chat_messages
			 WHERE member_id = ? AND created_at > ?
			 LIMIT 1`
		)
		.bind(memberId, cooldownSince)
		.first<{ id: string }>();

	if (recentMessage) {
		throw new Error('Please wait a few seconds before sending another message.');
	}

	await database
		.prepare('INSERT INTO bookclub_chat_messages (id, member_id, body) VALUES (?, ?, ?)')
		.bind(crypto.randomUUID(), memberId, body)
		.run();
}

export async function deleteChatMessage(database: D1Database, messageId: string): Promise<void> {
	await database.prepare('DELETE FROM bookclub_chat_messages WHERE id = ?').bind(messageId).run();
}
