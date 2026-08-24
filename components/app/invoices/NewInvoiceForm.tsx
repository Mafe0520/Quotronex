'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Package, Search, User } from 'lucide-react';
import { createInvoice } from '@/app/actions/invoices';

type Client = { id: string; name: string; phone: string | null; email: string | null };
type PBItem = { id: string; name: string; price_cents: number; unit: string | null };
type Item = { name: string; qty: number; unit_price_cents: number; unit: string | null };

const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const anim = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
const spring = { type: 'spring' as const, stiffness: 400, damping: 40 };

export function NewInvoiceForm({ clients, priceBook }: { clients: Client[]; priceBook: PBItem[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<Item[]>([{ name: '', qty: 1, unit_price_cents: 0, unit: null }]);
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [showClients, setShowClients] = useState(false);
  const [showPB, setShowPB] = useState(false);
  const [clientQ, setClientQ] = useState('');
  const [pbQ, setPbQ] = useState('');
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);
  const selectedClient = clients.find(c => c.id === clientId);

  const filteredClients = clientQ.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(clientQ.toLowerCase()))
    : clients;
  const filteredPB = pbQ.trim()
    ? priceBook.filter(p => p.name.toLowerCase().includes(pbQ.toLowerCase()))
    : priceBook;

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems(v => v.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }
  function removeItem(idx: number) { setItems(v => v.filter((_, i) => i !== idx)); }
  function addBlank() { setItems(v => [...v, { name: '', qty: 1, unit_price_cents: 0, unit: null }]); }
  function addFromPB(pb: PBItem) {
    setItems(v => [...v, { name: pb.name, qty: 1, unit_price_cents: pb.price_cents, unit: pb.unit }]);
    setShowPB(false);
  }

  function handleSave() {
    setError(null);
    if (!clientId) { setError('Selecciona un cliente'); return; }
    const valid = items.filter(i => i.name.trim());
    if (valid.length === 0) { setError('Agrega al menos un ítem'); return; }
    startSave(async () => {
      const { id, error: e } = await createInvoice({
        clientId,
        items: valid.map(i => ({ name: i.name.trim(), qty: i.qty, unit_price_cents: i.unit_price_cents, unit: i.unit ?? undefined })),
        notes: notes || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      if (e) { setError(e); return; }
      router.push(`/app/invoices/${id}`);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Nueva factura</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-32 flex flex-col gap-5">

        {/* Client */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Cliente *</label>
          <button onClick={() => setShowClients(true)}
            className={`flex h-12 items-center gap-3 rounded-2xl border px-4 text-left text-sm ${
              selectedClient
                ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] font-semibold text-[var(--text-primary)]'
                : 'border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] text-[var(--text-tertiary)]'
            }`}>
            <User size={15} className="shrink-0 text-[var(--text-tertiary)]" />
            {selectedClient?.name ?? 'Seleccionar cliente'}
          </button>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Ítems *</span>
            <button onClick={() => setShowPB(true)}
              className="flex h-7 items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Package size={11} /> Del catálogo
            </button>
          </div>

          {items.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={anim}
              className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input value={item.name} onChange={e => updateItem(idx, { name: e.target.value })}
                  placeholder="Nombre del servicio *"
                  className="flex-1 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                <button onClick={() => removeItem(idx)} className="flex size-9 shrink-0 items-center justify-center rounded-xl hover:bg-red-50">
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Cant.</label>
                  <input type="number" min="0.01" step="0.01" value={item.qty}
                    onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Precio unit.</label>
                  <input type="number" min="0" step="0.01"
                    value={item.unit_price_cents / 100}
                    onChange={e => updateItem(idx, { unit_price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Unidad</label>
                  <input value={item.unit ?? ''} onChange={e => updateItem(idx, { unit: e.target.value || null })}
                    placeholder="hr, m²..."
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-bold tabular-nums text-[var(--accent)]">{fmt(item.qty * item.unit_price_cents)}</span>
              </div>
            </motion.div>
          ))}

          <button onClick={addBlank}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-sm font-semibold text-[var(--text-secondary)]">
            <Plus size={15} /> Agregar ítem
          </button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-2xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-5 py-4">
          <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
          <span className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(total)}</span>
        </div>

        {/* Due date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Fecha de vencimiento</label>
          <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)}
            className="h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--accent)]" />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Términos, condiciones..."
            className="w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] resize-none" />
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] p-4">
        <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.97 }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
          {saving ? 'Creando…' : 'Crear factura'}
        </motion.button>
      </div>

      {/* Client picker */}
      {showClients && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowClients(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={spring}
            onClick={e => e.stopPropagation()}
            className="w-full max-h-[75dvh] rounded-t-3xl bg-[var(--bg)] flex flex-col">
            <div className="px-5 pt-5 pb-3">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <p className="mb-3 text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Seleccionar cliente</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input value={clientQ} onChange={e => setClientQ(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="h-10 w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-2">
              {filteredClients.map(c => (
                <button key={c.id} onClick={() => { setClientId(c.id); setShowClients(false); }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    c.id === clientId ? 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[var(--accent)]' : 'bg-[var(--surface)]'
                  }`}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
                    <span className="text-sm font-bold text-[var(--accent)]">{c.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                    {c.email && <p className="text-xs text-[var(--text-tertiary)]">{c.email}</p>}
                  </div>
                  {c.id === clientId && <span className="text-xs font-bold text-[var(--accent)]">✓</span>}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Sin resultados</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Price book picker */}
      {showPB && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowPB(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={spring}
            onClick={e => e.stopPropagation()}
            className="w-full max-h-[65dvh] rounded-t-3xl bg-[var(--bg)] flex flex-col">
            <div className="px-5 pt-5 pb-3">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <p className="mb-3 text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Catálogo</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input value={pbQ} onChange={e => setPbQ(e.target.value)}
                  placeholder="Buscar servicio..."
                  className="h-10 w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-2">
              {filteredPB.map(pb => (
                <button key={pb.id} onClick={() => addFromPB(pb)}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 text-left">
                  <Package size={15} color="var(--accent)" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{pb.name}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-[var(--accent)]">
                    {fmt(pb.price_cents)}{pb.unit ? `/${pb.unit}` : ''}
                  </span>
                </button>
              ))}
              {filteredPB.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Sin resultados</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
