'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Send, CheckCircle2, Clock } from 'lucide-react';
import { replyToTicket } from '@/app/actions/support';

type Message = { id: string; sender: string; body: string; created_at: string };
type Ticket = { id: string; subject: string; status: string; priority: string; created_at: string };

export function SupportThread({
  ticket,
  messages: initialMessages,
  userId,
}: {
  ticket: Ticket;
  messages: Message[];
  userId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState('');
  const [sending, startSend] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!reply.trim()) return;
    const text = reply.trim();
    setReply('');
    startSend(async () => {
      await replyToTicket(ticket.id, text);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: userId,
        body: text,
        created_at: new Date().toISOString(),
      }]);
    });
  }

  const resolved = ticket.status === 'resolved';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center gap-3 px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <a href="/app/support" className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{ticket.subject}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {resolved
              ? <CheckCircle2 size={11} className="text-green-600" />
              : <Clock size={11} className="text-amber-600" />}
            <span className={`text-xs font-semibold ${resolved ? 'text-green-600' : 'text-amber-600'}`}>
              {resolved ? 'Resuelto' : 'En revisión'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-32">
        {messages.map(msg => {
          const isUser = msg.sender === userId;
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isUser
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] rounded-bl-sm'
              }`}>
                {!isUser && (
                  <p className="mb-1 text-xs font-bold text-[var(--accent)]">Soporte Quotronex</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className={`mt-1 text-right text-[10px] ${isUser ? 'text-white/60' : 'text-[var(--text-tertiary)]'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!resolved && (
        <div className="fixed bottom-0 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] px-4 py-3 flex items-end gap-3">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            placeholder="Escribe un mensaje..."
            className="flex-1 resize-none rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] max-h-32 overflow-y-auto"
          />
          <motion.button whileTap={{ scale: 0.9 }} disabled={sending || !reply.trim()}
            onClick={handleSend}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white disabled:opacity-50">
            <Send size={17} />
          </motion.button>
        </div>
      )}

      {resolved && (
        <div className="fixed bottom-0 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] px-4 py-4">
          <p className="text-center text-sm text-[var(--text-tertiary)]">Este ticket fue resuelto. ¿Necesitas más ayuda? <a href="/app/support" className="font-semibold text-[var(--accent)]">Abre uno nuevo.</a></p>
        </div>
      )}
    </div>
  );
}
