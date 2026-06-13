'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, MessageCircle, X, Minimize2 } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ChatbotProps = {
  zoneContext?: string
  embedded?: boolean
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div
        style={{
          width: 32,
          height: 32,
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>AI</span>
      </div>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px 16px 16px 16px',
          padding: '10px 14px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--text-secondary)',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Chatbot({ zoneContext, embedded = false }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm SmartGrid Assistant, your AI helper for Nigeria's energy grid. I can help you with zone status, outage information, meter readings, and billing queries. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [minimized, setMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleNewSession = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "Starting a new session. How can I help you with SmartGrid AI today?",
        timestamp: new Date(),
      },
    ])
    setInput('')
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, zoneContext }),
      })

      const data = await res.json()
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, I could not process your request.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

  if (minimized && !embedded) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(26,31,94,0.3)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        <MessageCircle size={24} color="#fff" />
      </button>
    )
  }

  const containerStyle: React.CSSProperties = embedded
    ? {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 520,
      }
    : {
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 380,
        height: 560,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(26,31,94,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 100,
      }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          background: 'var(--primary)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: 'rgba(245,166,35,0.2)',
            border: '2px solid var(--accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageCircle size={16} color="var(--accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-sora font-semibold text-white text-sm">SmartGrid Assistant</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 4 }} />
            Online — AI-powered
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewSession}
            title="New session"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} />
          </button>
          {!embedded && (
            <button
              onClick={() => setMinimized(true)}
              title="Minimize"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Minimize2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'var(--background)',
        }}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--primary)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
            </div>
            <div style={{ maxWidth: '75%' }}>
              <div
                style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '10px 14px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about outages, billing, or zone status..."
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
            color: 'var(--text-primary)',
            resize: 'none',
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.4,
            maxHeight: 100,
            overflowY: 'auto',
          }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 100) + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'var(--primary)' : 'var(--border)',
            border: 'none',
            borderRadius: 10,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
