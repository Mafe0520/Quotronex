'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, FileText, Check, Trash2, AlertCircle } from 'lucide-react';
import { bulkImportPriceBookItems } from '@/app/actions/price-book';

type ParsedItem = {
  name: string;
  price_cents: number;
  unit: string | null;
  trade: string | null;
  description: string | null;
  selected: boolean;
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 40 };
const fmt = (c: number) => c > 0 ? `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

export function PriceBookImport({ onClose, onDone }: { onClose: () => void; onDone: (count: number) => void }) {
  const [step, setStep] = useState<'pick' | 'loading' | 'preview' | 'done'>('pick');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState('');
  const [importing, startImport] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  async function callAI(body: object) {
    setStep('loading');
    setError('');
    try {
      const res = await fetch('/api/ai/price-book-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error || !data.items?.length) {
        setError(data.error ?? 'No se encontraron ítems. Intenta con otro archivo.');
        setStep('pick');
        return;
      }
      setItems(data.items.map((i: Omit<ParsedItem, 'selected'>) => ({ ...i, selected: true })));
      setStep('preview');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setStep('pick');
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Archivo muy grande (máx 5 MB)'); return; }
    // CSV / TXT / Excel-as-text
    const text = await file.text();
    await callAI({ text });
    if (e.target) e.target.value = '';
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      await callAI({ imageBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  }

  function handlePaste() {
    if (!pastedText.trim()) return;
    callAI({ text: pastedText });
  }

  function toggleItem(idx: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }

  function handleImport() {
    const toImport = items.filter(i => i.selected).map(({ selected: _, ...rest }) => rest);
    if (!toImport.length) return;
    startImport(async () => {
      const { count, error } = await bulkImportPriceBookItems(toImport);
      if (error) { setError(error); return; }
      setStep('done');
      setTimeout(() => { onDone(count ?? 0); onClose(); }, 1200);
    });
  }

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
        className="w-full rounded-t-3xl bg-[var(--bg)] flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="mx-auto mb-1 absolute left-1/2 -translate-x-1/2 top-3 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
          <p className="text-base font-bold text-[var(--text-primary)]">
            {step === 'preview' ? `${items.length} ítems encontrados` : step === 'done' ? '¡Importado!' : 'Importar al catálogo'}
          </p>
          <button onClick={onClose}><X size={20} color="var(--text-tertiary)" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-4">

          {/* Pick step */}
          {step === 'pick' && (
            <>
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <p className="text-sm text-[var(--text-tertiary)]">
                La IA extrae automáticamente los servicios, precios y unidades de cualquier formato.
              </p>

              {/* CSV / Excel */}
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,.xls,.xlsx" className="hidden" onChange={handleFile} />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()}
                className="flex h-14 items-center gap-4 rounded-2xl bg-[var(--surface)] px-4 text-left">
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-50">
                  <Upload size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">CSV / Excel</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Sube un archivo .csv, .xlsx o .txt</p>
                </div>
              </motion.button>

              {/* Photo */}
              <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => photoRef.current?.click()}
                className="flex h-14 items-center gap-4 rounded-2xl bg-[var(--surface)] px-4 text-left">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                  <Camera size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Foto de lista de precios</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Toma o sube una foto de tu catálogo</p>
                </div>
              </motion.button>

              {/* Paste text */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPaste(v => !v)}
                className="flex h-14 items-center gap-4 rounded-2xl bg-[var(--surface)] px-4 text-left">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50">
                  <FileText size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Pegar texto</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Copia y pega tu lista directamente</p>
                </div>
              </motion.button>

              <AnimatePresence>
                {showPaste && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 overflow-hidden">
                    <textarea
                      autoFocus
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      rows={6}
                      placeholder={'Pega aquí tu lista de precios...\nEj:\nInstalación de drywall, $45/hr\nPintura interior, $35/sqft\n...'}
                      className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none font-mono"
                    />
                    <motion.button whileTap={{ scale: 0.97 }} disabled={!pastedText.trim()}
                      onClick={handlePaste}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-50">
                      Extraer ítems con IA
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="size-10 rounded-full border-4 border-[color-mix(in_oklab,var(--accent)_20%,transparent)] border-t-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Analizando con IA…</p>
              <p className="text-xs text-[var(--text-tertiary)] text-center">Extrayendo nombres, precios y categorías</p>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-tertiary)]">{selectedCount} de {items.length} seleccionados</p>
                <div className="flex gap-3">
                  <button onClick={() => setItems(p => p.map(i => ({ ...i, selected: true })))}
                    className="text-xs font-semibold text-[var(--accent)]">Todos</button>
                  <button onClick={() => setItems(p => p.map(i => ({ ...i, selected: false })))}
                    className="text-xs font-semibold text-[var(--text-tertiary)]">Ninguno</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                  <motion.button key={idx} whileTap={{ scale: 0.98 }}
                    onClick={() => toggleItem(idx)}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${item.selected ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] opacity-50'}`}>
                    <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${item.selected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]'}`}>
                      {item.selected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.name}</p>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--text-primary)]">{fmt(item.price_cents)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.trade && <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">{item.trade}</span>}
                        {item.unit && <span className="text-[10px] text-[var(--text-tertiary)]">por {item.unit}</span>}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setItems(p => p.filter((_, i) => i !== idx)); }}
                      className="flex size-6 shrink-0 items-center justify-center text-[var(--text-tertiary)] hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </motion.button>
                ))}
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

              <motion.button whileTap={{ scale: 0.97 }} disabled={importing || selectedCount === 0}
                onClick={handleImport}
                className="sticky bottom-0 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60 shadow-lg">
                {importing ? 'Importando…' : `Importar ${selectedCount} ítem${selectedCount !== 1 ? 's' : ''}`}
              </motion.button>
            </>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
                <Check size={26} className="text-green-600" strokeWidth={2.5} />
              </div>
              <p className="text-base font-bold text-[var(--text-primary)]">¡Importación exitosa!</p>
              <p className="text-sm text-[var(--text-tertiary)]">{selectedCount} ítems agregados al catálogo</p>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
