'use client'

import { useState, useTransition, useEffect } from 'react'
import { MessageSquare, Clock, AlertCircle, CheckCircle, Send, ChevronRight } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  open:               { label: 'Open',             color: 'bg-blue-500/15 text-blue-400' },
  waiting_on_admin:   { label: 'Waiting on you',   color: 'bg-red-500/15 text-red-400' },
  waiting_on_user:    { label: 'Waiting on user',  color: 'bg-amber-500/15 text-amber-400' },
  resolved:           { label: 'Resolved',         color: 'bg-emerald-500/15 text-emerald-400' },
  closed:             { label: 'Closed',           color: 'bg-[#1a1a1a] text-[#666]' },
}

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-[#444]',
  normal: 'bg-blue-500',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export interface SupportTicket {
  id: string
  business_id: string
  businessName: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender: 'user' | 'admin'
  body: string
  created_at: string
}

async function fetchMessages(ticketId: string): Promise<SupportMessage[]> {
  const res = await fetch(`/api/admin/support/messages?ticketId=${ticketId}`)
  if (!res.ok) return []
  return res.json()
}

function TicketDetail({ ticket, adminId, onClose }: { ticket: SupportTicket; adminId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [reply, setReply] = useState('')
  const [sending, startSending] = useTransition()

  useEffect(() => {
    fetchMessages(ticket.id).then(setMessages)
  }, [ticket.id])

  async function sendReply() {
    if (!reply.trim()) return
    startSending(async () => {
      await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, body: reply.trim(), adminId }),
      })
      setMessages(await fetchMessages(ticket.id))
      setReply('')
    })
  }

  const st = STATUS_STYLES[ticket.status]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a] px-6 py-4">
        <div>
          <button onClick={onClose} className="mb-2 flex items-center gap-1 text-xs text-[#555] hover:text-[#888]">
            ← Back
          </button>
          <h2 className="font-bold text-white">{ticket.subject}</h2>
          <p className="mt-0.5 text-xs text-[#555]">{ticket.businessName} · {fmtDate(ticket.updated_at)}</p>
        </div>
        {st && (
          <span className={`shrink-0 mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${st.color}`}>
            {st.label}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {messages === null ? (
          <p className="text-sm text-[#555]">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#555]">No messages yet.</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex flex-col gap-1 ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.sender === 'admin'
                  ? 'bg-[var(--accent)] text-[var(--bg)] rounded-br-sm'
                  : 'bg-[#1a1a1a] text-[#ccc] rounded-bl-sm'
              }`}>
                {m.body}
              </div>
              <span className="text-[10px] text-[#444]">{fmtDate(m.created_at)}</span>
            </div>
          ))
        )}
      </div>

      {/* Reply box */}
      <div className="border-t border-[#1a1a1a] px-6 py-4">
        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta…"
            rows={3}
            className="flex-1 resize-none rounded-xl border border-[#222] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
          />
          <button
            onClick={sendReply}
            disabled={sending || !reply.trim()}
            className="flex h-10 w-10 shrink-0 self-end items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-1.5 text-right text-[10px] text-[#444]">⌘↵ to send</p>
      </div>
    </div>
  )
}

export function SupportInbox({ tickets, adminId }: { tickets: SupportTicket[]; adminId: string }) {
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  const shown = tickets.filter(t =>
    filter === 'all' || (t.status !== 'resolved' && t.status !== 'closed')
  )

  if (selected) {
    return (
      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden" style={{ minHeight: 600 }}>
        <TicketDetail ticket={selected} adminId={adminId} onClose={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(['open', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f ? 'bg-[#222] text-white' : 'text-[#555] hover:text-[#888]'
            }`}
          >
            {f === 'open' ? 'Open' : 'All tickets'}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#1a1a1a] py-20 text-center">
          <CheckCircle size={32} className="text-emerald-500/40" />
          <p className="text-sm text-[#555]">No open tickets — inbox is clean.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a1a1a] divide-y divide-[#111] overflow-hidden">
          {shown.map(t => {
            const st = STATUS_STYLES[t.status]
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#0d0d14] transition-colors"
              >
                <span className={`mt-1 size-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? 'bg-[#444]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{t.subject}</span>
                    {st && (
                      <span className={`shrink-0 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#555]">{t.businessName} · {fmtDate(t.updated_at)}</p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-[#444]" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
