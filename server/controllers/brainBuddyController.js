
const db = require('../database/db');
const { chatWithBrainBuddy } = require('../services/brainBuddyService');

async function chat(req, res) {
  const { message, conversationId } = req.body;
  const userId = req.user.id;

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message is too long. Maximum 4000 characters.' });
  }

  let previousMessages = [];

  if (conversationId !== undefined && conversationId !== null) {
    if (!Number.isInteger(Number(conversationId)) || Number(conversationId) < 1) {
      return res.status(400).json({ error: 'Invalid conversation ID.' });
    }

    const conversation = await db.one(
      'SELECT id FROM brainbuddy_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    previousMessages = await db.many(
      `SELECT role, content FROM brainbuddy_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC, id ASC`,
      [conversationId]
    );
  }

  let reply;

try {
  reply = await chatWithBrainBuddy({
    message: message.trim(),
    history: previousMessages.slice(-12)
  });
} catch (error) {
  console.error('[BrainBuddy AI]', error.message);

  if (error.message === 'BrainBuddy AI is not configured.') {
    return res.status(503).json({
      error: 'BrainBuddy is being prepared! AI chat will be available once the AI service is activated. Your BrainBridge account and other features are working normally.'
    });
  }

  return res.status(503).json({
    error: 'BrainBuddy could not respond right now. Please try again later.'
  });
}

  const saved = await db.tx(async (client) => {
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const result = await client.query(
        `INSERT INTO brainbuddy_conversations (user_id, title)
         VALUES ($1, $2) RETURNING id`,
        [userId, message.trim().slice(0, 80)]
      );

      currentConversationId = result.rows[0].id;
    }

    await client.query(
      `INSERT INTO brainbuddy_messages (conversation_id, role, content)
       VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
      [currentConversationId, message.trim(), reply]
    );

    await client.query(
      'UPDATE brainbuddy_conversations SET updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [currentConversationId, userId]
    );

    return currentConversationId;
  });

  return res.json({
    success: true,
    reply,
    assistant: 'BrainBuddy',
    provider: 'Anthropic',
    conversationId: saved
  });
}

async function listConversations(req, res) {
  const conversations = await db.many(
    `SELECT id, title, created_at, updated_at
     FROM brainbuddy_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [req.user.id]
  );

  return res.json({ conversations });
}

async function getConversation(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid conversation ID.' });
  }

  const conversation = await db.one(
    `SELECT id, title, created_at, updated_at
     FROM brainbuddy_conversations
     WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  const messages = await db.many(
    `SELECT id, role, content, created_at
     FROM brainbuddy_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC, id ASC`,
    [id]
  );

  return res.json({ conversation, messages });
}

async function deleteConversation(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid conversation ID.' });
  }

  const result = await db.query(
    `DELETE FROM brainbuddy_conversations
     WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  return res.json({ success: true });
}

module.exports = {
  chat,
  listConversations,
  getConversation,
  deleteConversation
};
