'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Package, Search, FileText, Calendar } from 'lucide-react';
import { updateQuoteItems, updateQuoteMeta } from '@/app/actions/quotes';

type Item = { id?: string; name: string; description: string | null; qty: number; unit_price_cents: number; unit: string | null; price_book_item_id?: string | null; markup_pct?: number | null; item_type?: string | null };
type PBItem = { id: string; name: string; price_cents: number; unit: string | null; trade: string | null };

const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const anim = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

interface Props {
  quoteId: string;
  initial: { notes: string; expires_at: string };
  items: Item[];
  priceBook: PBItem[];
}

export function QuoteEditForm({ quoteId, initial, items: initItems, priceBook }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initItems.length > 0 ? initItems : [{ name: '', description: null, qty: 1, unit_price_cents: 0, unit: null }]);
  const [notes, setNotes] = useState(initial.notes);
  const [expiresAt, setExpiresAt] = useState(initial.expires_at ? initial.expires_at.slice(0, 10) : '');
  const [showPB, setShowPB] = useState(false);
  const [pbQ, setPbQ] = useState('');
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectivePrice = (item: Item) => Math.round(item.unit_price_cents * (1 + (item.markup_pct ?? 0) / 100));
  const total = items.reduce((s, i) => s + i.qty * effectivePrice(i), 0);

  function addItem() {
    setItems(v => [...v, { name: '', description: null, qty: 1, unit_price_cents: 0, unit: null }]);
  }

  function removeItem(idx: number) {
    setItems(v => v.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems(v => v.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  function addFromPB(pb: PBItem) {
    setItems(v => [...v, { name: pb.name, description: null, qty: 1, unit_price_cents: pb.price_cents, unit: pb.unit, price_book_item_id: pb.id }]);
    setShowPB(false);
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      const validItems = items.filter(i => i.name.trim());
      if (validItems.length === 0) { setError('Agrega al menos un ítem'); return; }

      const [r1, r2] = await Promise.all([
        updateQuoteItems(quoteId, validItems.map(i => ({
          name: i.name.trim(),
          description: i.description ?? undefined,
          qty: i.qty,
          unit_price_cents: effectivePrice(i),
          unit: i.unit ?? undefined,
          price_book_item_id: i.price_book_item_id ?? undefined,
          markup_pct: i.markup_pct ?? null,
          item_type: i.item_type ?? null,
        }))),
        updateQuoteMeta(quoteId, { notes: notes || undefined, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }),
      ]);

      if (r1.error || r2.error) { setError(r1.error ?? r2.error ?? 'Error'); return; }
      router.push(`/app/quotes/${quoteId}`);
    });
  }

  const filteredPB = pbQ.trim()
    ? priceBook.filter(p => p.name.toLowerCase().includes(pbQ.toLowerCase()) || p.trade?.toLowerCase().includes(pbQ.toLowerCase()))
    : priceBook;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Editar cotización</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-32 flex flex-col gap-5">

        {/* Items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Ítems</h2>
            <button onClick={() => setShowPB(true)}
              className="flex h-7 items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Package size={11} /> Del catálogo
            </button>
          </div>

          {items.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={anim}
              className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <input value={item.name} onChange={e => updateItem(idx, { name: e.target.value })}
                  placeholder="Nombre del servicio *"
                  className="flex-1 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                <button onClick={() => removeItem(idx)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl hover:bg-red-50">
                  <Trash2 size={15} className="text-red-500" />
                </button>
              </div>
              <input value={item.description ?? ''} onChange={e => updateItem(idx, { description: e.target.value || null })}
                placeholder="Descripción (opcional)"
                className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]" />
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Cant.</label>
                  <input type="number" min="0.01" step="0.01" value={item.qty}
                    onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Precio unit.</label>
                  <input type="number" min="0" step="0.01"
                    value={item.unit_price_cents / 100}
                    onChange={e => updateItem(idx, { unit_price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Markup %</label>
                  <input type="number" min="0" step="1" placeholder="0"
                    value={item.markup_pct ?? ''}
                    onChange={e => {
                      const pct = parseFloat(e.target.value) || null;
                      updateItem(idx, { markup_pct: pct });
                    }}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Unidad</label>
                  <input value={item.unit ?? ''} onChange={e => updateItem(idx, { unit: e.target.value || null })}
                    placeholder="hr, m²..."
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)]">Tipo</label>
                  <select value={item.item_type ?? 'service'} onChange={e => updateItem(idx, { item_type: e.target.value })}
                    className="rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                    <option value="service">Servicio</option>
                    <option value="labor">Labor</option>
                    <option value="material">Material</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                  = {fmt(item.qty * item.unit_price_cents * (1 + (item.markup_pct ?? 0) / 100))}
                </span>
              </div>
            </motion.div>
          ))}

          <button onClick={addItem}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-sm font-semibold text-[var(--text-secondary)]">
            <Plus size={15} /> Agregar ítem
          </button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-2xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-5 py-4">
          <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
          <span className="text-xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(total)}</span>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <FileText size={13} color="var(--text-tertiary)" />
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Notas para el cliente</label>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Términos, condiciones, instrucciones adicionales..."
            className="w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] resize-none" />
        </div>

        {/* Expiration */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} color="var(--text-tertiary)" />
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Válida hasta</label>
          </div>
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
            className="h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] p-4">
        <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.97 }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
          {saving ? (
            <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : 'Guardar cambios'}
        </motion.button>
      </div>

      {/* Price Book sheet */}
      {showPB && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowPB(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-h-[70dvh] rounded-t-3xl bg-[var(--bg)] flex flex-col">
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
                    {pb.trade && <p className="text-xs text-[var(--text-tertiary)]">{pb.trade}</p>}
                  </div>
                  <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
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
