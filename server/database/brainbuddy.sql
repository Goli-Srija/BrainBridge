
-- BrainBuddy conversation history
-- Safe migration: creates only new tables.

CREATE TABLE IF NOT EXISTS brainbuddy_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainbuddy_conversations_user
ON brainbuddy_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS brainbuddy_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL
    REFERENCES brainbuddy_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainbuddy_messages_conversation
ON brainbuddy_messages(conversation_id, created_at ASC);
