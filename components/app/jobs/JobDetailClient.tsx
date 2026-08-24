'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Briefcase, Phone, Mail, FileText, Calendar,
  CheckCircle2, PlayCircle, PauseCircle, XCircle, MoreHorizontal,
  Flag, Camera, Plus, Trash2, X, AlertTriangle, Clock, Wrench, Star,
  ChevronRight,
} from 'lucide-react';
import {
  updateJobStatus, archiveJob, updateJobFlags, completeJob,
  addChangeOrder, updateChangeOrderStatus, deleteJobPhoto,
} from '@/app/actions/jobs';
import { addExpense, deleteExpense } from '@/app/actions/expenses';
import { createClient } from '@supabase/supabase-js';
import { JobNotes } from '@/components/app/jobs/JobNotes';
import { JobAssignments } from '@/components/app/jobs/JobAssignments';

const supabasePub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type QuoteItem = { id: string; name: string; description: string | null; qty: number; unit_price_cents: number; unit: string | null };
type JobPhoto = { id: string; url: string; phase: 'before' | 'during' | 'after'; caption: string | null; created_at: string };
type ChangeOrder = { id: string; description: string; amount_cents: number; status: 'pending' | 'approved' | 'declined'; created_at: string };
type Expense = { id: string; description: string; amount_cents: number; category: string; vendor: string | null; expense_date: string; receipt_url: string | null };
type TimeEntry = { id: string; worker_name: string | null; clocked_in_at: string; clocked_out_at: string | null; status: string };

type Job = {
  id: string;
  title: string | null;
  status: string;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  archived_at: string | null;
  quote_id: string | null;
  flags: string[];
  completion_summary: string | null;
  warranty_notes: string | null;
  completed_at: string | null;
  quotes: {
    id: string;
    total_cents: number;
    clients: { id: string; name: string; phone: string | null; email: string | null } | null;
  } | null;
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled:   { label: 'Programado',  color: 'bg-blue-50 text-blue-700',    icon: <Calendar size={14} /> },
  in_progress: { label: 'En progreso', color: 'bg-amber-50 text-amber-700',  icon: <PlayCircle size={14} /> },
  completed:   { label: 'Completado',  color: 'bg-green-50 text-green-700',  icon: <CheckCircle2 size={14} /> },
  on_hold:     { label: 'En pausa',    color: 'bg-gray-100 text-gray-600',   icon: <PauseCircle size={14} /> },
  canceled:    { label: 'Cancelado',   color: 'bg-red-50 text-red-600',      icon: <XCircle size={14} /> },
};

const FLAGS = [
  { id: 'needs_attention',    label: 'Needs Attention',      icon: <AlertTriangle size={13} />, color: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'waiting_customer',   label: 'Waiting on Customer',  icon: <Clock size={13} />,         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'parts_ordered',      label: 'Parts Ordered',        icon: <Wrench size={13} />,        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'permit_required',    label: 'Permit Required',      icon: <FileText size={13} />,      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'priority',           label: 'Priority',             icon: <Star size={13} />,          color: 'bg-orange-50 text-orange-600 border-orange-200' },
];

const PHASES: { key: 'before' | 'during' | 'after'; label: string }[] = [
  { key: 'before', label: 'Antes' },
  { key: 'during', label: 'Durante' },
  { key: 'after',  label: 'Después' },
];

const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const spring = { type: 'spring' as const, stiffness: 400, damping: 40 };

const EXPENSE_CATS: Record<string, string> = {
  materials: '🧱 Materiales', tools: '🔧 Herramientas',
  fuel: '⛽ Combustible', food: '🍔 Comida', other: '📦 Otro',
}

export function JobDetailClient({
  job: initialJob,
  quoteItems,
  photos: initialPhotos,
  changeOrders: initialChangeOrders,
  expenses: initialExpenses = [],
  timeEntries: initialTimeEntries = [],
  jobNotes: initialNotes = [],
  canSeePrivate = false,
  assignments = [],
  allMembers = [],
}: {
  job: Job;
  quoteItems: QuoteItem[];
  photos: JobPhoto[];
  changeOrders: ChangeOrder[];
  expenses?: Expense[];
  timeEntries?: TimeEntry[];
  jobNotes?: { id: string; body: string; is_private: boolean; created_at: string; author_id: string | null }[];
  canSeePrivate?: boolean;
  assignments?: { id: string; user_id: string; member: { name: string | null; email: string | null; role: string } | null }[];
  allMembers?: { id: string; user_id: string; name: string | null; email: string | null; role: string }[];
}) {
  const [job, setJob] = useState(initialJob);
  const [photos, setPhotos] = useState(initialPhotos);
  const [changeOrders, setChangeOrders] = useState(initialChangeOrders);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [timeEntries] = useState(initialTimeEntries);
  const [tab, setTab] = useState<'overview' | 'photos' | 'orders' | 'expenses' | 'time' | 'notes'>('overview');
  const [showMore, setShowMore] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [showNewCO, setShowNewCO] = useState(false);
  const [showFlagsSheet, setShowFlagsSheet] = useState(false);
  const [completeSummary, setCompleteSummary] = useState(job.completion_summary ?? '');
  const [warrantyNotes, setWarrantyNotes] = useState(job.warranty_notes ?? '');
  const [coDesc, setCoDesc] = useState('');
  const [coAmount, setCoAmount] = useState('');
  const [uploadingPhase, setUploadingPhase] = useState<'before' | 'during' | 'after' | null>(null);
  const [updating, startUpdate] = useTransition();
  const [completing, startComplete] = useTransition();
  const [savingCO, startCO] = useTransition();
  const [deletingPhoto, startDeletePhoto] = useTransition();
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('materials');
  const [expVendor, setExpVendor] = useState('');
  const [expReceiptUrl, setExpReceiptUrl] = useState<string | null>(null);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [savingExp, startExp] = useTransition();
  const [deletingExp, startDeleteExp] = useTransition();
  const receiptRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activePhaseRef = useRef<'before' | 'during' | 'after'>('during');

  const meta = STATUS_META[job.status] ?? STATUS_META.scheduled;
  const client = job.quotes?.clients;
  const total = job.quotes?.total_cents;

  const approvedExtra = changeOrders
    .filter(co => co.status === 'approved')
    .reduce((s, co) => s + co.amount_cents, 0);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const totalLaborMins = timeEntries
    .filter(e => e.clocked_out_at && e.status === 'approved')
    .reduce((s, e) => s + Math.round((new Date(e.clocked_out_at!).getTime() - new Date(e.clocked_in_at).getTime()) / 60000), 0);
  const revenue = (total ?? 0) + approvedExtra;
  const profit = revenue - totalExpenses;

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingReceipt(true);
    try {
      // Upload to Supabase storage
      const { createClient: createSup } = await import('@supabase/supabase-js');
      const sup = createSup(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${job.id}/${Date.now()}.${ext}`;
      await sup.storage.from('receipts').upload(path, file);
      const { data: { publicUrl } } = sup.storage.from('receipts').getPublicUrl(path);
      setExpReceiptUrl(publicUrl);

      // AI extraction
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        const res = await fetch('/api/ai/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (!data.error) {
          if (data.description) setExpDesc(data.description);
          if (data.vendor) setExpVendor(data.vendor);
          if (data.amount_cents) setExpAmount(String(data.amount_cents / 100));
          if (data.category) setExpCat(data.category);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setAnalyzingReceipt(false);
      if (receiptRef.current) receiptRef.current.value = '';
    }
  }

  function handleAddExpense() {
    if (!expDesc.trim()) return;
    startExp(async () => {
      const cents = Math.round(parseFloat(expAmount || '0') * 100);
      const { id } = await addExpense(job.id, {
        description: expDesc.trim(),
        amount_cents: cents,
        category: expCat,
        vendor: expVendor.trim() || undefined,
        receipt_url: expReceiptUrl ?? undefined,
      });
      if (id) {
        setExpenses(prev => [...prev, {
          id, description: expDesc.trim(), amount_cents: cents,
          category: expCat, vendor: expVendor.trim() || null,
          expense_date: new Date().toISOString().slice(0, 10),
          receipt_url: expReceiptUrl,
        }]);
        setExpDesc(''); setExpAmount(''); setExpVendor(''); setExpReceiptUrl(null); setShowNewExpense(false);
      }
    });
  }

  function handleDeleteExpense(id: string) {
    startDeleteExp(async () => {
      await deleteExpense(id, job.id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    });
  }

  function setStatus(status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold' | 'canceled') {
    if (status === 'completed' && job.status !== 'completed') {
      setShowCompleteSheet(true);
      return;
    }
    startUpdate(async () => {
      await updateJobStatus(job.id, status);
      setJob(j => ({ ...j, status }));
    });
  }

  function toggleFlag(flagId: string) {
    const next = job.flags.includes(flagId)
      ? job.flags.filter(f => f !== flagId)
      : [...job.flags, flagId];
    setJob(j => ({ ...j, flags: next }));
    startUpdate(async () => { await updateJobFlags(job.id, next); });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const phase = activePhaseRef.current;
    setUploadingPhase(phase);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${job.id}/${phase}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabasePub.storage.from('job-photos').upload(path, file, { upsert: false });
      if (upErr) { alert('Error al subir foto'); return; }
      const { data: { publicUrl } } = supabasePub.storage.from('job-photos').getPublicUrl(path);

      // Save record via API route
      const res = await fetch('/api/jobs/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, url: publicUrl, phase }),
      });
      const saved = await res.json();
      if (saved.id) setPhotos(p => [...p, { id: saved.id, url: publicUrl, phase, caption: null, created_at: new Date().toISOString() }]);
    } finally {
      setUploadingPhase(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function openPicker(phase: 'before' | 'during' | 'after') {
    activePhaseRef.current = phase;
    fileRef.current?.click();
  }

  function handleCompleteSubmit() {
    startComplete(async () => {
      await completeJob(job.id, { completion_summary: completeSummary, warranty_notes: warrantyNotes });
      setJob(j => ({ ...j, status: 'completed', completion_summary: completeSummary, warranty_notes: warrantyNotes }));
      setShowCompleteSheet(false);
    });
  }

  function handleAddCO() {
    if (!coDesc.trim()) return;
    startCO(async () => {
      const cents = Math.round(parseFloat(coAmount || '0') * 100);
      const { id } = await addChangeOrder(job.id, { description: coDesc.trim(), amount_cents: cents });
      if (id) {
        setChangeOrders(cos => [...cos, { id, description: coDesc.trim(), amount_cents: cents, status: 'pending', created_at: new Date().toISOString() }]);
        setCoDesc(''); setCoAmount(''); setShowNewCO(false);
      }
    });
  }

  function handleCOStatus(id: string, status: 'approved' | 'declined') {
    startUpdate(async () => {
      await updateChangeOrderStatus(id, status);
      setChangeOrders(cos => cos.map(co => co.id === id ? { ...co, status } : co));
    });
  }

  function handleDeletePhoto(photoId: string) {
    startDeletePhoto(async () => {
      await deleteJobPhoto(photoId, job.id);
      setPhotos(p => p.filter(x => x.id !== photoId));
    });
  }

  const NEXT_ACTIONS = job.status === 'scheduled' ? [
    { label: 'Iniciar trabajo', status: 'in_progress' as const, icon: <PlayCircle size={16} />, color: 'bg-amber-500' },
    { label: 'Cancelar', status: 'canceled' as const, icon: <XCircle size={16} />, color: 'bg-red-500' },
  ] : job.status === 'in_progress' ? [
    { label: 'Marcar completado', status: 'completed' as const, icon: <CheckCircle2 size={16} />, color: 'bg-green-600' },
    { label: 'Poner en pausa', status: 'on_hold' as const, icon: <PauseCircle size={16} />, color: 'bg-gray-500' },
  ] : job.status === 'on_hold' ? [
    { label: 'Reanudar', status: 'in_progress' as const, icon: <PlayCircle size={16} />, color: 'bg-amber-500' },
    { label: 'Cancelar', status: 'canceled' as const, icon: <XCircle size={16} />, color: 'bg-red-500' },
  ] : [];

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <a href="/app/jobs" className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Trabajo</h1>
        <button onClick={() => setShowMore(true)} className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <MoreHorizontal size={20} color="var(--text-secondary)" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-5">
        {(['overview', 'photos', 'orders', 'expenses', 'time', 'notes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`mr-5 pb-2.5 pt-3 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-tertiary)]'}`}>
            {t === 'overview' ? 'Resumen'
              : t === 'photos' ? `Fotos${photos.length > 0 ? ` (${photos.length})` : ''}`
              : t === 'orders' ? `Cambios${changeOrders.length > 0 ? ` (${changeOrders.length})` : ''}`
              : t === 'expenses' ? `Gastos${expenses.length > 0 ? ` (${expenses.length})` : ''}`
              : t === 'time' ? `Horas${timeEntries.length > 0 ? ` (${timeEntries.length})` : ''}`
              : `Notas${initialNotes.length > 0 ? ` (${initialNotes.length})` : ''}`}
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 flex flex-col gap-5">

        {/* ── OVERVIEW TAB ─────────────────────────────────── */}
        {tab === 'overview' && (<>
          {/* Title + status */}
          <div className="flex flex-col gap-2">
            <div className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>
              {meta.icon}{meta.label}
            </div>
            <h2 className="text-2xl font-black [font-family:var(--font-display)] text-[var(--text-primary)] leading-tight">
              {job.title ?? 'Trabajo'}
            </h2>
            {total !== undefined && (
              <p className="text-3xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
                {fmt((total ?? 0) + approvedExtra)}
                {approvedExtra > 0 && <span className="ml-2 text-base font-semibold text-green-600">+{fmt(approvedExtra)} CO</span>}
              </p>
            )}
          </div>

          {/* Flags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Flags</p>
              <button onClick={() => setShowFlagsSheet(true)} className="flex items-center gap-1 text-xs text-[var(--accent)] font-semibold">
                <Flag size={12} /> Editar
              </button>
            </div>
            {job.flags.length === 0 ? (
              <button onClick={() => setShowFlagsSheet(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-xs text-[var(--text-tertiary)]">
                <Plus size={13} /> Sin flags
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {FLAGS.filter(f => job.flags.includes(f.id)).map(f => (
                  <span key={f.id} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${f.color}`}>
                    {f.icon}{f.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          {NEXT_ACTIONS.length > 0 && (
            <div className="flex flex-col gap-2">
              {NEXT_ACTIONS.map(a => (
                <motion.button key={a.status} whileTap={{ scale: 0.97 }} disabled={updating}
                  onClick={() => setStatus(a.status)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white disabled:opacity-60 ${a.color}`}>
                  {a.icon}{a.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Completed state */}
          {job.status === 'completed' && (
            <div className="rounded-2xl bg-green-50 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-700">Trabajo completado</p>
                {job.completed_at && <p className="text-xs text-green-600 ml-auto">{new Date(job.completed_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</p>}
              </div>
              {job.completion_summary && <p className="text-xs text-green-700 pl-6">{job.completion_summary}</p>}
              {job.warranty_notes && (
                <div className="mt-1 pl-6">
                  <p className="text-xs font-semibold text-green-700">Garantía:</p>
                  <p className="text-xs text-green-600">{job.warranty_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Client */}
          {client && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Cliente</p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                  <span className="text-sm font-bold text-[var(--accent)]">{client.name.slice(0, 1).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{client.name}</p>
                  {client.phone && <p className="text-sm text-[var(--text-tertiary)]">{client.phone}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {client.phone && (
                  <a href={`tel:${client.phone}`}
                    className="flex flex-1 h-10 items-center justify-center gap-2 rounded-xl bg-[var(--bg)] text-sm font-semibold text-[var(--text-secondary)]">
                    <Phone size={14} /> Llamar
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`}
                    className="flex flex-1 h-10 items-center justify-center gap-2 rounded-xl bg-[var(--bg)] text-sm font-semibold text-[var(--text-secondary)]">
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Scope */}
          {quoteItems.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Alcance del trabajo</p>
              {quoteItems.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                    {item.description && <p className="text-xs text-[var(--text-tertiary)]">{item.description}</p>}
                    <p className="text-xs text-[var(--text-tertiary)]">{item.qty} {item.unit ?? 'und'} × {fmt(item.unit_price_cents)}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)] shrink-0">
                    {fmt(item.qty * item.unit_price_cents)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Team assignments */}
          {allMembers && allMembers.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] p-4">
              <JobAssignments
                jobId={job.id}
                initialAssignments={assignments ?? []}
                allMembers={allMembers}
              />
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 flex gap-3">
              <FileText size={15} className="shrink-0 text-[var(--text-tertiary)] mt-0.5" />
              <p className="text-sm text-[var(--text-secondary)]">{job.notes}</p>
            </div>
          )}

          {/* Dates */}
          {(job.start_date || job.end_date) && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Fechas</p>
              {job.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Inicio: {new Date(job.start_date).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</span>
                </div>
              )}
              {job.end_date && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Fin: {new Date(job.end_date).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</span>
                </div>
              )}
            </div>
          )}

          {/* View quote */}
          {job.quote_id && (
            <a href={`/app/quotes/${job.quote_id}`}
              className="flex h-12 items-center justify-between gap-2 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-secondary)]">
              <div className="flex items-center gap-2"><Briefcase size={15} /> Ver cotización original</div>
              <ChevronRight size={15} />
            </a>
          )}

          {/* Profitability mini-card */}
          {revenue > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Rentabilidad</p>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Ingresos</span>
                <span className="font-bold tabular-nums text-[var(--text-primary)]">{fmt(revenue)}</span>
              </div>
              {totalExpenses > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Gastos</span>
                  <span className="font-bold tabular-nums text-red-500">-{fmt(totalExpenses)}</span>
                </div>
              )}
              <div className="h-px bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[var(--text-primary)]">Ganancia</span>
                <span className={`text-base font-black tabular-nums [font-family:var(--font-display)] ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {profit >= 0 ? fmt(profit) : `-${fmt(Math.abs(profit))}`}
                </span>
              </div>
              <button onClick={() => setTab('expenses')} className="text-xs font-semibold text-[var(--accent)] text-left">
                Ver detalle de gastos →
              </button>
            </div>
          )}
        </>)}

        {/* ── PHOTOS TAB ────────────────────────────────────── */}
        {tab === 'photos' && (<>
          {PHASES.map(({ key, label }) => {
            const phasePhotos = photos.filter(p => p.phase === key);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => openPicker(key)}
                    disabled={uploadingPhase !== null}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                    {uploadingPhase === key ? '…' : <><Camera size={12} /> Agregar</>}
                  </motion.button>
                </div>
                {phasePhotos.length === 0 ? (
                  <button onClick={() => openPicker(key)}
                    className="flex h-28 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-xs text-[var(--text-tertiary)]">
                    <Camera size={16} /> Tomar foto {label.toLowerCase()}
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {phasePhotos.map(photo => (
                      <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          disabled={deletingPhoto}
                          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-60">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => openPicker(key)}
                      className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] text-[var(--text-tertiary)]">
                      <Plus size={20} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </>)}

        {/* ── CHANGE ORDERS TAB ─────────────────────────────── */}
        {tab === 'orders' && (<>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--text-primary)]">Change Orders</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNewCO(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white">
              <Plus size={12} /> Nuevo
            </motion.button>
          </div>

          {changeOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Wrench size={32} color="var(--text-tertiary)" />
              <p className="text-sm text-[var(--text-tertiary)]">No hay change orders</p>
              <button onClick={() => setShowNewCO(true)} className="text-sm font-semibold text-[var(--accent)]">Agregar el primero</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {changeOrders.map(co => (
                <div key={co.id} className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)] flex-1">{co.description}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ${
                      co.status === 'approved' ? 'bg-green-50 text-green-700' :
                      co.status === 'declined' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {co.status === 'approved' ? 'Aprobado' : co.status === 'declined' ? 'Declinado' : 'Pendiente'}
                    </span>
                  </div>
                  {co.amount_cents > 0 && (
                    <p className="text-lg font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(co.amount_cents)}</p>
                  )}
                  {co.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
                        onClick={() => handleCOStatus(co.id, 'approved')}
                        className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-green-600 text-sm font-bold text-white disabled:opacity-60">
                        <CheckCircle2 size={14} /> Aprobar
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
                        onClick={() => handleCOStatus(co.id, 'declined')}
                        className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-sm font-bold text-red-600 disabled:opacity-60">
                        <XCircle size={14} /> Declinar
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}

              {approvedExtra > 0 && (
                <div className="rounded-2xl bg-green-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-green-700">Total adicional aprobado</p>
                  <p className="text-sm font-black tabular-nums text-green-700">{fmt(approvedExtra)}</p>
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── GASTOS TAB ────────────────────────────────────── */}
        {tab === 'expenses' && (<>
          {/* Profitability summary */}
          {revenue > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] p-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Ingresos</p>
                <p className="text-sm font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{fmt(revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Gastos</p>
                <p className="text-sm font-black tabular-nums [font-family:var(--font-display)] text-red-500">{fmt(totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Ganancia</p>
                <p className={`text-sm font-black tabular-nums [font-family:var(--font-display)] ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {profit >= 0 ? fmt(profit) : `-${fmt(Math.abs(profit))}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--text-primary)]">Gastos</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNewExpense(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white">
              <Plus size={12} /> Agregar
            </motion.button>
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText size={32} color="var(--text-tertiary)" />
              <p className="text-sm text-[var(--text-tertiary)]">No hay gastos registrados</p>
              <button onClick={() => setShowNewExpense(true)} className="text-sm font-semibold text-[var(--accent)]">Registrar primer gasto</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {expenses.map(exp => (
                <div key={exp.id} className="rounded-2xl bg-[var(--surface)] p-4 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] flex-1">{exp.description}</p>
                      <p className="text-base font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)] shrink-0">{fmt(exp.amount_cents)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                        {EXPENSE_CATS[exp.category] ?? exp.category}
                      </span>
                      {exp.vendor && <span className="text-xs text-[var(--text-tertiary)]">{exp.vendor}</span>}
                      <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                        {new Date(exp.expense_date).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                      </span>
                    </div>
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)] font-semibold">
                        Ver recibo →
                      </a>
                    )}
                  </div>
                  <button onClick={() => handleDeleteExpense(exp.id)} disabled={deletingExp}
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] text-[var(--text-tertiary)] disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {totalExpenses > 0 && (
                <div className="rounded-2xl bg-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Total gastos</p>
                  <p className="text-sm font-black tabular-nums text-[var(--text-primary)]">{fmt(totalExpenses)}</p>
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── TIME TAB ─────────────────────────────────────── */}
        {tab === 'time' && (<>
          {/* Summary */}
          {totalLaborMins > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-[var(--text-tertiary)]">Total aprobado</p>
              <p className="text-sm font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
                {Math.floor(totalLaborMins / 60)}h {totalLaborMins % 60}m
              </p>
            </div>
          )}
          {timeEntries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center gap-2">
              <Clock size={32} className="text-[var(--text-tertiary)]" />
              <p className="font-semibold text-[var(--text-primary)]">Sin registros de horas</p>
              <p className="text-sm text-[var(--text-tertiary)]">Los trabajadores registran su tiempo desde la vista de campo.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {timeEntries.map(e => {
                const inTime = new Date(e.clocked_in_at);
                const outTime = e.clocked_out_at ? new Date(e.clocked_out_at) : null;
                const mins = outTime ? Math.round((outTime.getTime() - inTime.getTime()) / 60000) : null;
                const statusColor: Record<string, string> = {
                  approved: 'text-green-600 bg-green-50',
                  pending: 'text-amber-600 bg-amber-50',
                  rejected: 'text-red-500 bg-red-50',
                };
                const statusLabel: Record<string, string> = { approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado' };
                return (
                  <div key={e.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{e.worker_name ?? 'Trabajador'}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[e.status] ?? 'text-[var(--text-tertiary)] bg-[var(--surface)]'}`}>
                        {statusLabel[e.status] ?? e.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {inTime.toLocaleDateString('es', { month: 'short', day: 'numeric' })} · {inTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      {outTime ? ` → ${outTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : ' → en curso'}
                    </p>
                    {mins !== null && (
                      <p className="text-xs font-semibold tabular-nums text-[var(--text-secondary)] mt-0.5">
                        {Math.floor(mins / 60)}h {mins % 60}m
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* ── NOTES TAB ─────────────────────────────────────── */}
        {tab === 'notes' && (
          <JobNotes jobId={job.id} initialNotes={initialNotes} canSeePrivate={canSeePrivate} />
        )}
      </div>

      {/* ── SHEETS ──────────────────────────────────────────── */}

      {/* More sheet */}
      <AnimatePresence>
        {showMore && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowMore(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-2">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <button onClick={() => { setShowMore(false); archiveJob(job.id); }}
                className="flex h-12 items-center gap-3 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-600">
                <XCircle size={16} /> Archivar trabajo
              </button>
              <button onClick={() => setShowMore(false)}
                className="flex h-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flags sheet */}
      <AnimatePresence>
        {showFlagsSheet && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowFlagsSheet(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-3">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <p className="text-base font-bold text-[var(--text-primary)] mb-1">Flags del trabajo</p>
              {FLAGS.map(f => {
                const active = job.flags.includes(f.id);
                return (
                  <motion.button key={f.id} whileTap={{ scale: 0.97 }} onClick={() => toggleFlag(f.id)}
                    className={`flex h-12 items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-colors ${active ? f.color : 'border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
                    {f.icon}{f.label}
                    {active && <CheckCircle2 size={15} className="ml-auto" />}
                  </motion.button>
                );
              })}
              <button onClick={() => setShowFlagsSheet(false)}
                className="mt-1 flex h-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                Listo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete sheet */}
      <AnimatePresence>
        {showCompleteSheet && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-4">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text-primary)]">Completar trabajo</p>
                <button onClick={() => setShowCompleteSheet(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>
              {/* Close checklist */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Antes de cerrar, verifica:</p>
                {[
                  { id: 'photos', label: `Fotos tomadas${photos.length > 0 ? ` (${photos.length})` : ''}`, done: photos.length > 0 },
                  { id: 'invoice', label: job.quotes?.id ? 'Cotización asociada ✓' : 'Sin cotización ligada', done: !!job.quotes?.id },
                  { id: 'summary', label: 'Resumen completado', done: completeSummary.trim().length > 0 },
                ].map(item => (
                  <div key={item.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${item.done ? 'bg-green-50 text-green-700' : 'bg-[var(--surface)] text-[var(--text-tertiary)]'}`}>
                    {item.done
                      ? <CheckCircle2 size={15} className="shrink-0 text-green-600" />
                      : <div className="size-3.5 shrink-0 rounded-full border-2 border-[color-mix(in_oklab,var(--text-tertiary)_40%,transparent)]" />}
                    {item.label}
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Resumen de lo que se hizo</label>
                <textarea
                  value={completeSummary}
                  onChange={e => setCompleteSummary(e.target.value)}
                  rows={3}
                  placeholder="Ej: Se instalaron 3 cuartos de piso laminado, se repararon 2 parches de drywall..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Notas de garantía (opcional)</label>
                <textarea
                  value={warrantyNotes}
                  onChange={e => setWarrantyNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Garantía de mano de obra 1 año, materiales 5 años..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} disabled={completing}
                onClick={handleCompleteSubmit}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-bold text-white disabled:opacity-60">
                <CheckCircle2 size={16} /> {completing ? 'Guardando…' : 'Confirmar trabajo completado'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Expense sheet */}
      <AnimatePresence>
        {showNewExpense && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text-primary)]">Registrar gasto</p>
                <button onClick={() => setShowNewExpense(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>

              {/* Receipt photo */}
              <input ref={receiptRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptUpload} />
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => receiptRef.current?.click()}
                disabled={analyzingReceipt}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent)_5%,transparent)] text-sm font-semibold text-[var(--accent)] disabled:opacity-60">
                <Camera size={16} />
                {analyzingReceipt ? 'Analizando recibo con AI…' : expReceiptUrl ? '✓ Recibo subido — cambiar' : 'Tomar foto del recibo (AI extrae datos)'}
              </motion.button>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Descripción *</label>
                <input
                  autoFocus
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  placeholder="Ej: Pintura exterior, tornillos 3/8..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 h-12 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Monto</label>
                <div className="flex items-center rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4">
                  <span className="text-sm text-[var(--text-tertiary)] mr-1">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                    <button key={k} onClick={() => setExpCat(k)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${expCat === k ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Proveedor (opcional)</label>
                <input
                  value={expVendor}
                  onChange={e => setExpVendor(e.target.value)}
                  placeholder="Home Depot, Lowes..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 h-12 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} disabled={savingExp || !expDesc.trim()}
                onClick={handleAddExpense}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60">
                {savingExp ? 'Guardando…' : 'Guardar gasto'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Change Order sheet */}
      <AnimatePresence>
        {showNewCO && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-4">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text-primary)]">Nuevo Change Order</p>
                <button onClick={() => setShowNewCO(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Descripción del cambio</label>
                <textarea
                  autoFocus
                  value={coDesc}
                  onChange={e => setCoDesc(e.target.value)}
                  rows={3}
                  placeholder="Ej: Cliente pidió agregar canaletas en la parte trasera..."
                  className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Monto adicional (opcional)</label>
                <div className="flex items-center rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4">
                  <span className="text-sm text-[var(--text-tertiary)] mr-1">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={coAmount}
                    onChange={e => setCoAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} disabled={savingCO || !coDesc.trim()}
                onClick={handleAddCO}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60">
                {savingCO ? 'Guardando…' : 'Agregar change order'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
