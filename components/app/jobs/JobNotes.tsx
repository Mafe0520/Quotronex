'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Globe, Trash2, Send, StickyNote } from 'lucide-react';
import { addJobNote, deleteJobNote } from '@/app/actions/job-notes';

type Note = { id: string; body: string; is_private: boolean; created_at: string; author_id: string | null };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function JobNotes({ jobId, initialNotes, canSeePrivate = true }: {
  jobId: string;
  initialNotes: Note[];
  canSeePrivate?: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [adding, startAdd] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!body.trim()) return;
    setAddError(null);
    startAdd(async () => {
      const res = await addJobNote(jobId, body, isPrivate);
      if (res.error) { setAddError(res.error); return; }
      setNotes(prev => [{
        id: crypto.randomUUID(),
        body: body.trim(),
        is_private: isPrivate,
        created_at: new Date().toISOString(),
        author_id: null,
      }, ...prev]);
      setBody('');
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <StickyNote size={15} color="var(--accent)" />
        <p className="text-sm font-bold text-[var(--text-primary)]">Notas internas</p>
      </div>

      {/* Composer */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          placeholder="Agrega una nota sobre este trabajo..."
          className="resize-none rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        {addError && <p className="text-xs text-red-600">{addError}</p>}
        <div className="flex items-center justify-between gap-2">
          {canSeePrivate && (
            <button
              type="button"
              onClick={() => setIsPrivate(v => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                isPrivate
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] text-[var(--text-secondary)]'
              }`}
            >
              {isPrivate ? <Lock size={11} /> : <Globe size={11} />}
              {isPrivate ? 'Privada (solo managers)' : 'Visible al equipo'}
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={adding || !body.trim()}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-xs font-bold text-white disabled:opacity-50"
          >
            <Send size={12} /> {adding ? 'Guardando...' : 'Agregar'}
          </motion.button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {notes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-3 rounded-2xl p-3 ${
                note.is_private
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-[var(--surface)]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {note.is_private
                  ? <Lock size={13} className="text-amber-500" />
                  : <Globe size={13} className="text-[var(--text-tertiary)]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--text-primary)]" style={{ whiteSpace: 'pre-wrap' }}>{note.body}</p>
                <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{fmtDate(note.created_at)}</p>
              </div>
              <button
                onClick={() => startDelete(async () => {
                  await deleteJobNote(note.id, jobId);
                  setNotes(prev => prev.filter(n => n.id !== note.id));
                })}
                disabled={deleting}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={13} color="#ef4444" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {notes.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)]">Sin notas aún.</p>
        )}
      </div>
    </div>
  );
}
