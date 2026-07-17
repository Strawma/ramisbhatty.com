PRAGMA foreign_keys = ON;

ALTER TABLE bookclub_chat_messages
	ADD COLUMN message_type TEXT NOT NULL DEFAULT 'user'
	CHECK (message_type IN ('user', 'announcement'));

CREATE INDEX bookclub_chat_messages_type_idx ON bookclub_chat_messages(message_type);
