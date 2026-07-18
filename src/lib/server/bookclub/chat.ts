import type { D1Database } from '@cloudflare/workers-types';
import { isReadableChatColor } from './colors';

const CHAT_MESSAGE_LIMIT = 50;
const CHAT_MESSAGE_COOLDOWN_MS = 5_000;
export const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const CHAT_PRESENCE_WINDOW_MS = 20_000;

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
	canRestore: boolean;
	deletedBy: 'member' | 'admin' | null;
}

export interface BookclubChatMember {
	id: string;
	name: string;
	isOwn: boolean;
	isOnline: boolean;
}

export interface BookclubChatState {
	messages: BookclubChatMessage[];
	members: BookclubChatMember[];
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
	original_body: string | null;
	deleted_by: 'member' | 'admin' | null;
}

interface ChatMemberRow {
	id: string;
	name: string;
	last_seen_at: string | null;
}

export async function getChatMessages(
	database: D1Database,
	memberId: string
): Promise<BookclubChatMessage[]> {
	const messages = await database
		.prepare(
			`SELECT chat.id, chat.member_id, members.name AS member_name, members.chat_color AS member_color,
			        chat.body, chat.created_at,
			        chat.message_type, chat.deleted_at, chat.original_body, chat.deleted_by
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
		isDeleted: Boolean(message.deleted_at),
		canRestore: Boolean(message.deleted_at && message.original_body),
		deletedBy: message.deleted_by
	}));
}

export async function getChatMembers(
	database: D1Database,
	memberId: string
): Promise<BookclubChatMember[]> {
	const cutoff = new Date(Date.now() - CHAT_PRESENCE_WINDOW_MS).toISOString();
	const members = await database
		.prepare(
			`SELECT id, name, last_seen_at
			 FROM bookclub_members
			 WHERE active = 1
			 ORDER BY CASE WHEN last_seen_at >= ? THEN 0 ELSE 1 END, lower(name)`
		)
		.bind(cutoff)
		.all<ChatMemberRow>();

	return members.results.map((member) => ({
		id: member.id,
		name: member.name,
		isOwn: member.id === memberId,
		isOnline: member.last_seen_at !== null && member.last_seen_at >= cutoff
	}));
}

export async function getChatroomState(
	database: D1Database,
	memberId: string
): Promise<BookclubChatState> {
	const [messages, members] = await Promise.all([
		getChatMessages(database, memberId),
		getChatMembers(database, memberId)
	]);

	return { messages, members };
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
	messageId: string,
	adminMemberId: string
): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_chat_messages
			 SET original_body = body, body = '[DELETED BY ADMIN]', deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
			     deleted_by = 'admin'
			 WHERE id = ? AND member_id != ? AND message_type = 'user' AND deleted_at IS NULL`
		)
		.bind(messageId, adminMemberId)
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
			 SET original_body = body, body = '[DELETED BY MEMBER]', deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
			     deleted_by = 'member'
			 WHERE id = ? AND member_id = ? AND message_type = 'user' AND deleted_at IS NULL`
		)
		.bind(messageId, memberId)
		.run();

	return Boolean(result.meta.changes);
}

export async function restoreChatMessage(
	database: D1Database,
	messageId: string,
	memberId: string,
	isAdmin: boolean
): Promise<boolean> {
	const result = await database
		.prepare(
			`UPDATE bookclub_chat_messages
			 SET body = original_body, original_body = NULL, deleted_at = NULL, deleted_by = NULL
			 WHERE id = ? AND message_type = 'user' AND deleted_at IS NOT NULL AND original_body IS NOT NULL
			   AND ((member_id = ? AND deleted_by = 'member') OR (? = 1 AND deleted_by = 'admin'))`
		)
		.bind(messageId, memberId, isAdmin ? 1 : 0)
		.run();

	return Boolean(result.meta.changes);
}
