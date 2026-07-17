PRAGMA foreign_keys = ON;

ALTER TABLE bookclub_chat_messages ADD COLUMN deleted_at TEXT;

CREATE INDEX bookclub_chat_messages_deleted_idx ON bookclub_chat_messages(deleted_at);
