'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, X, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { createSupportTicket } from '@/app/actions/support';
import { useRouter } from 'next/navigation';

type Ticket = { id: string; subject: string; status: string; priority: string; created_at: string; updated_at: string };

const spring = { type: 'spring' as const, stiffness: 400, damping: 40 };

export function SupportList({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, startSave] = useTransition();

  function handleCreate() {
    if (!subject.trim() || !body.trim()) return;
    startSave(async () => {
      const { id, error } = await createSupportTicket(subject.trim(), body.trim());
      if (id) {
        setShowNew(false);
        setSubject(''); setBody('');
        router.push(`/app/support/${id}`);
      } else if (error) alert(error);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <a href="/app/settings" className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Soporte</h1>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowNew(true)}
          className="flex size-10 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <Plus size={18} />
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 flex flex-col gap-3">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <MessageCircle size={40} color="var(--text-tertiary)" />
            <div>
              <p className="font-bold text-[var(--text-primary)]">Sin tickets de soporte</p>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">¿Tienes algún problema o pregunta?</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowNew(true)}
              className="flex h-12 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-bold text-white">
              <Plus size={15} /> Abrir ticket
            </motion.button>
          </div>
        ) : (
          tickets.map(t => (
            <motion.a key={t.id} href={`/app/support/${t.id}`} whileTap={{ scale: 0.98 }}
              className="flex items-start gap-3 rounded-2xl bg-[var(--surface)] p-4">
              <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${t.status === 'resolved' ? 'bg-green-50' : 'bg-amber-50'}`}>
                {t.status === 'resolved'
                  ? <CheckCircle2 size={15} className="text-green-600" />
                  : <Clock size={15} className="text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.subject}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {t.status === 'resolved' ? 'Resuelto' : 'Abierto'}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(t.updated_at).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                  </span>
                </div>
              </div>
            </motion.a>
          ))
        )}
      </div>

      {/* New ticket sheet */}
      <AnimatePresence>
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-4">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text-primary)]">Nuevo ticket de soporte</p>
                <button onClick={() => setShowNew(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Asunto *</label>
                <input
                  autoFocus
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ej: No puedo enviar la cotización..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 h-12 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Describe el problema *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={4}
                  placeholder="Cuéntanos qué pasó, qué esperabas que pasara y en qué pantalla estabas..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} disabled={saving || !subject.trim() || !body.trim()}
                onClick={handleCreate}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60">
                {saving ? 'Enviando…' : 'Enviar ticket'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
