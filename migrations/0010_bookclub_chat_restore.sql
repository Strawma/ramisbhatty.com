ALTER TABLE bookclub_chat_messages ADD COLUMN original_body TEXT;
ALTER TABLE bookclub_chat_messages ADD COLUMN deleted_by TEXT CHECK (deleted_by IN ('member', 'admin'));
