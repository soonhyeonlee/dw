'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
}

const MODELS: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
];

export default function LlmChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
  const [dropupOpen, setDropupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
        setDropupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api<{ reply: string; model: string }>('/llm/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel.id,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      setMessages([...newMessages, { role: 'assistant', content: res.data!.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `오류: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const providerColor = (provider: string) =>
    provider === 'OpenAI' ? '#10a37f' : '#4285f4';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>LLM 채팅</h1>
        <div style={styles.modelBadge}>
          <span
            style={{
              ...styles.providerDot,
              background: providerColor(selectedModel.provider),
            }}
          />
          {selectedModel.name}
        </div>
      </div>

      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            모델을 선택하고 메시지를 입력하세요
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msgRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble),
              }}
            >
              {msg.role === 'assistant' && (
                <span style={styles.bubbleLabel}>{selectedModel.name}</span>
              )}
              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <span style={styles.loadingDots}>응답 생성 중...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          {/* 드롭업 모델 선택 */}
          <div ref={dropupRef} style={styles.dropupWrapper}>
            <button
              style={styles.dropupBtn}
              onClick={() => setDropupOpen(!dropupOpen)}
            >
              <span
                style={{
                  ...styles.providerDot,
                  background: providerColor(selectedModel.provider),
                }}
              />
              {selectedModel.name}
              <span style={styles.arrow}>{dropupOpen ? '▼' : '▲'}</span>
            </button>
            {dropupOpen && (
              <div style={styles.dropupMenu}>
                <div style={styles.dropupSection}>
                  <div style={styles.dropupSectionTitle}>OpenAI</div>
                  {MODELS.filter((m) => m.provider === 'OpenAI').map((m) => (
                    <button
                      key={m.id}
                      style={{
                        ...styles.dropupItem,
                        ...(m.id === selectedModel.id
                          ? styles.dropupItemActive
                          : {}),
                      }}
                      onClick={() => {
                        setSelectedModel(m);
                        setDropupOpen(false);
                      }}
                    >
                      <span
                        style={{ ...styles.providerDot, background: '#10a37f' }}
                      />
                      {m.name}
                    </button>
                  ))}
                </div>
                <div style={styles.dropupDivider} />
                <div style={styles.dropupSection}>
                  <div style={styles.dropupSectionTitle}>Google</div>
                  {MODELS.filter((m) => m.provider === 'Google').map((m) => (
                    <button
                      key={m.id}
                      style={{
                        ...styles.dropupItem,
                        ...(m.id === selectedModel.id
                          ? styles.dropupItemActive
                          : {}),
                      }}
                      onClick={() => {
                        setSelectedModel(m);
                        setDropupOpen(false);
                      }}
                    >
                      <span
                        style={{ ...styles.providerDot, background: '#4285f4' }}
                      />
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter로 전송)"
            rows={1}
            disabled={loading}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  title: { fontSize: '24px', fontWeight: 700 },
  modelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    background: '#f3f4f6',
    fontSize: '13px',
    fontWeight: 500,
  },
  providerDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    textAlign: 'center' as const,
    color: '#9ca3af',
    marginTop: '120px',
    fontSize: '15px',
  },
  msgRow: { display: 'flex' },
  bubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  userBubble: {
    background: '#ff6b35',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    background: '#f3f4f6',
    color: '#1f2937',
    borderBottomLeftRadius: '4px',
  },
  bubbleLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '4px',
  },
  loadingDots: { color: '#9ca3af', fontStyle: 'italic' as const },
  inputArea: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  dropupWrapper: { position: 'relative' as const },
  dropupBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  arrow: { fontSize: '10px', color: '#9ca3af', marginLeft: '2px' },
  dropupMenu: {
    position: 'absolute' as const,
    bottom: '100%',
    left: 0,
    marginBottom: '8px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    padding: '8px',
    minWidth: '200px',
    zIndex: 50,
  },
  dropupSection: {},
  dropupSectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    padding: '4px 10px',
    textTransform: 'uppercase' as const,
  },
  dropupDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '6px 0',
  },
  dropupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#374151',
  },
  dropupItemActive: {
    background: 'rgba(255,107,53,0.1)',
    color: '#ff6b35',
    fontWeight: 600,
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    resize: 'none' as const,
    outline: 'none',
    minHeight: '42px',
    maxHeight: '120px',
    fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    border: 'none',
    background: '#ff6b35',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
};
