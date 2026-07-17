import type { D1Database } from '@cloudflare/workers-types';

const CHAT_MESSAGE_LIMIT = 50;
const CHAT_MESSAGE_COOLDOWN_MS = 5_000;
const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export class ChatCooldownError extends Error {
	constructor() {
		super('Please wait a few seconds before sending another message.');
		this.name = 'ChatCooldownError';
	}
}

export interface BookclubChatMessage {
	id: string;
	memberId: string;
	memberName: string;
	body: string;
	createdAt: string;
	isOwn: boolean;
	isAnnouncement: boolean;
}

interface ChatMessageRow {
	id: string;
	member_id: string;
	member_name: string;
	body: string;
	created_at: string;
	message_type: 'user' | 'announcement';
}

export async function getChatMessages(
	database: D1Database,
	memberId: string
): Promise<BookclubChatMessage[]> {
	const results = await database.batch([
		database
			.prepare('DELETE FROM bookclub_chat_messages WHERE created_at < ?')
			.bind(new Date(Date.now() - CHAT_RETENTION_MS).toISOString()),
		database
			.prepare(
				`SELECT chat.id, chat.member_id, members.name AS member_name, chat.body, chat.created_at,
				        chat.message_type
				 FROM bookclub_chat_messages AS chat
				 INNER JOIN bookclub_members AS members ON members.id = chat.member_id
				 ORDER BY chat.created_at DESC
				 LIMIT ?`
			)
			.bind(CHAT_MESSAGE_LIMIT)
	]);
	const messages = results[1] as { results: ChatMessageRow[] };

	return messages.results.reverse().map((message) => ({
		id: message.id,
		memberId: message.member_id,
		memberName: message.member_name,
		body: message.body,
		createdAt: message.created_at,
		isOwn: message.member_id === memberId,
		isAnnouncement: message.message_type === 'announcement'
	}));
}

export function prepareChatAnnouncement(database: D1Database, memberId: string, body: string) {
	return database
		.prepare(
			`INSERT INTO bookclub_chat_messages (id, member_id, body, message_type)
			 VALUES (?, ?, ?, 'announcement')`
		)
		.bind(crypto.randomUUID(), memberId, body);
}

export async function createChatMessage(
	database: D1Database,
	memberId: string,
	body: string
): Promise<void> {
	const cooldownSince = new Date(Date.now() - CHAT_MESSAGE_COOLDOWN_MS).toISOString();
	const result = await database
		.prepare(
			`INSERT INTO bookclub_chat_messages (id, member_id, body)
			 SELECT ?, ?, ?
			 WHERE NOT EXISTS (
				 SELECT 1
				 FROM bookclub_chat_messages
				 WHERE member_id = ? AND created_at > ?
			 )`
		)
		.bind(crypto.randomUUID(), memberId, body, memberId, cooldownSince)
		.run();

	if (!result.meta.changes) {
		throw new ChatCooldownError();
	}
}

export async function deleteChatMessage(database: D1Database, messageId: string): Promise<void> {
	await database.prepare('DELETE FROM bookclub_chat_messages WHERE id = ?').bind(messageId).run();
}
