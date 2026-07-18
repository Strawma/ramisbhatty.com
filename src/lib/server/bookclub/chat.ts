import type { D1Database } from '@cloudflare/workers-types';
import { isReadableChatColor } from './colors';

const CHAT_MESSAGE_LIMIT = 50;
const CHAT_MESSAGE_COOLDOWN_MS = 5_000;
export const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

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
	memberColor: string;
	memberColorNeedsOutline: boolean;
	body: string;
	createdAt: string;
	isOwn: boolean;
	isAnnouncement: boolean;
	isDeleted: boolean;
}

interface ChatMessageRow {
	id: string;
	member_id: string;
	member_name: string;
	member_color: string;
	body: string;
	created_at: string;
	message_type: 'user' | 'announcement';
	deleted_at: string | null;
}

export async function getChatMessages(
	database: D1Database,
	memberId: string
): Promise<BookclubChatMessage[]> {
	const messages = await database
		.prepare(
			`SELECT chat.id, chat.member_id, members.name AS member_name, members.chat_color AS member_color,
			        chat.body, chat.created_at,
			        chat.message_type, chat.deleted_at
			 FROM bookclub_chat_messages AS chat
			 INNER JOIN bookclub_members AS members ON members.id = chat.member_id
			 WHERE chat.created_at >= ?
			 ORDER BY chat.created_at DESC
			 LIMIT ?`
		)
		.bind(new Date(Date.now() - CHAT_RETENTION_MS).toISOString(), CHAT_MESSAGE_LIMIT)
		.all<ChatMessageRow>();

	return messages.results.reverse().map((message) => ({
		id: message.id,
		memberId: message.member_id,
		memberName: message.member_name,
		memberColor: message.member_color,
		memberColorNeedsOutline: !isReadableChatColor(message.member_color),
		body: message.body,
		createdAt: message.created_at,
		isOwn: message.member_id === memberId,
		isAnnouncement: message.message_type === 'announcement',
		isDeleted: Boolean(message.deleted_at)
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

export async function tombstoneChatMessageByAdmin(
	database: D1Database,
	messageId: string
): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_chat_messages
			 SET body = '[DELETED BY ADMIN]', deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = ? AND message_type = 'user' AND deleted_at IS NULL`
		)
		.bind(messageId)
		.run();

	return Boolean(result.meta.changes);
}

export async function tombstoneOwnChatMessage(
	database: D1Database,
	messageId: string,
	memberId: string
): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_chat_messages
			 SET body = '[DELETED BY MEMBER]', deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			 WHERE id = ? AND member_id = ? AND message_type = 'user' AND deleted_at IS NULL`
		)
		.bind(messageId, memberId)
		.run();

	return Boolean(result.meta.changes);
}
