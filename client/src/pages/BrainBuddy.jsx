import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import Icon from '../components/Icon';
import './BrainBuddy.css';

const suggestions = [
  { icon: 'code', title: 'Learn programming', prompt: 'Teach me Java programming from the basics.' },
  { icon: 'brain', title: 'Practice DSA', prompt: 'Help me prepare for DSA interviews with a study plan.' },
  { icon: 'briefcase', title: 'Placement guidance', prompt: 'How should I prepare for software developer placements?' },
  { icon: 'heart', title: 'Motivate me', prompt: 'I am feeling unmotivated. Help me get back on track.' },
];

export default function BrainBuddy() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const messagesEndRef = useRef(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, loading]);


  async function loadConversations() {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const result = await api.get('/brainbuddy/conversations');
      setConversations(result.conversations || []);
    } catch (error) {
      setHistoryError(error.message || 'Could not load chat history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const result = await api.post('/brainbuddy/chat', {
        message,
        conversationId,
      });

      setConversationId(result.conversationId);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply },
      ]);

      await loadConversations();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error.message || 'Sorry, I could not respond. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(id) {
    if (loading) return;

    try {
      const result = await api.get(`/brainbuddy/conversations/${id}`);
      setConversationId(result.conversation.id);
      setMessages(result.messages || []);
      setHistoryError('');
    } catch (error) {
      setHistoryError(error.message || 'Could not open this conversation.');
    }
  }

  async function deleteConversation(id) {
    if (loading) return;

    const confirmed = window.confirm('Delete this conversation permanently?');
    if (!confirmed) return;

    try {
      await api.del(`/brainbuddy/conversations/${id}`);

      setConversations((prev) => prev.filter((item) => item.id !== id));

      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      setHistoryError(error.message || 'Could not delete conversation.');
    }
  }

  function newChat() {
    if (loading) return;
    setMessages([]);
    setConversationId(null);
    setInput('');
    setHistoryError('');
  }

  return (
    <div className="brainbuddy-page">
      <div className="brainbuddy-header">
        <div className="brainbuddy-title">
          <span className="brainbuddy-avatar"><Icon name="sparkles" /></span>
          <div>
            <h1>BrainBuddy</h1>
            <p>Your personal AI companion</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={newChat} disabled={loading}>
          <Icon name="refresh" /> New chat
        </button>
      </div>

      <div className="brainbuddy-workspace">
        <aside className="brainbuddy-history">
          <div className="brainbuddy-history-heading">
            <strong>Recent conversations</strong>
            <button onClick={loadConversations} disabled={historyLoading} title="Refresh history">
              <Icon name="refresh" />
            </button>
          </div>

          {historyLoading ? (
            <p className="brainbuddy-history-empty">Loading history...</p>
          ) : conversations.length === 0 ? (
            <p className="brainbuddy-history-empty">
              No saved conversations yet. Start chatting!
            </p>
          ) : (
            <div className="brainbuddy-history-list">
              {conversations.map((item) => (
                <div
                  className={`brainbuddy-history-item ${conversationId === item.id ? 'active' : ''}`}
                  key={item.id}
                >
                  <button
                    className="brainbuddy-history-open"
                    onClick={() => openConversation(item.id)}
                    disabled={loading}
                  >
                    <Icon name="message-circle" />
                    <span>{item.title}</span>
                  </button>

                  <button
                    className="brainbuddy-history-delete"
                    onClick={() => deleteConversation(item.id)}
                    disabled={loading}
                    title="Delete conversation"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="brainbuddy-chat-panel">
          {messages.length === 0 ? (
            <div className="brainbuddy-welcome">
              <div className="brainbuddy-welcome-icon">
                <Icon name="sparkles" size={32} />
              </div>
              <h2>Hey there! I'm BrainBuddy.</h2>
              <p>
                Your study partner, placement mentor and motivation coach.
                Ask me anything. Let's make your placement journey easier!
              </p>

              <div className="brainbuddy-suggestions">
                {suggestions.map((item) => (
                  <button
                    className="brainbuddy-suggestion"
                    key={item.title}
                    onClick={() => sendMessage(item.prompt)}
                    disabled={loading}
                  >
                    <Icon name={item.icon} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.prompt}</small>
                    </span>
                    <Icon name="arrow-up-right" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="brainbuddy-messages">
              {messages.map((item, index) => (
                <div className={`brainbuddy-message ${item.role}`} key={item.id || index}>
                  <div className="message-avatar">
                    <Icon name={item.role === 'assistant' ? 'sparkles' : 'user'} />
                  </div>
                  <div className="message-content">
                    <strong>{item.role === 'assistant' ? 'BrainBuddy' : 'You'}</strong>
                    <p>{item.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="brainbuddy-typing">
                  <Icon name="sparkles" /> BrainBuddy is thinking...
                  
                </div>
              )}
              <div ref={messagesEndRef} />

            </div>
          )}
          
          {historyError && (
            <p className="brainbuddy-history-error">{historyError}</p>
          )}

          <form
            className="brainbuddy-composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask BrainBuddy anything..."
              rows={2}
              maxLength={4000}
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <Icon name="send" />
            </button>

            <small>Enter to send · Shift + Enter for a new line</small>
          </form>
        </section>
      </div>
    </div>
  );
}
