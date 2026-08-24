'use client';

import { useState, useTransition, useActionState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Pencil, FileText, X, Check } from 'lucide-react';
import { createMessageTemplate, updateMessageTemplate, deleteMessageTemplate } from '@/app/actions/message-templates';

type Template = { id: string; name: string; body: string };

function TemplateForm({ onClose, template }: { onClose: () => void; template?: Template }) {
  const action = template
    ? updateMessageTemplate.bind(null, template.id)
    : createMessageTemplate;
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await action(prev, fd);
    if (!err) onClose();
    return err;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--text-primary)]">{template ? 'Editar plantilla' : 'Nueva plantilla'}</p>
        <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
          <X size={15} color="var(--text-tertiary)" />
        </button>
      </div>
      <input
        name="name"
        required
        defaultValue={template?.name ?? ''}
        placeholder="Nombre de la plantilla (ej. Seguimiento)"
        className="h-11 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
      />
      <textarea
        name="body"
        required
        rows={4}
        defaultValue={template?.body ?? ''}
        placeholder="Hola {nombre}, adjunto tu cotización..."
        className="resize-none rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
      />
      <p className="text-[10px] text-[var(--text-tertiary)]">Usa <code className="font-mono">{'{nombre}'}</code> para el nombre del cliente.</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={pending}
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white disabled:opacity-60">
        <Check size={14} /> {pending ? 'Guardando...' : 'Guardar plantilla'}
      </motion.button>
    </form>
  );
}

export function MessageTemplates({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleting, startDelete] = useTransition();

  const handleDelete = (id: string) => {
    startDelete(async () => {
      await deleteMessageTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} color="var(--accent)" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Plantillas de mensaje</p>
        </div>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex h-8 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 text-xs font-semibold text-[var(--accent)]">
          <Plus size={12} /> Nueva
        </motion.button>
      </div>

      <AnimatePresence>
        {(showForm && !editing) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TemplateForm onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {templates.length === 0 && !showForm && (
        <p className="text-xs text-[var(--text-tertiary)]">Guarda mensajes frecuentes para enviarlos rápido al cotizar.</p>
      )}

      <div className="flex flex-col gap-2">
        {templates.map(t => (
          <div key={t.id}>
            <AnimatePresence>
              {editing?.id === t.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TemplateForm template={t} onClose={() => setEditing(null)} />
                </motion.div>
              )}
            </AnimatePresence>
            {editing?.id !== t.id && (
              <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{t.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-tertiary)]">{t.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEditing(t)}
                    className="flex size-7 items-center justify-center rounded-lg hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
                    <Pencil size={13} color="var(--text-tertiary)" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} disabled={deleting}
                    className="flex size-7 items-center justify-center rounded-lg hover:bg-red-50 disabled:opacity-40">
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
