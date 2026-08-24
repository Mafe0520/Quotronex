'use client';

import { useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, Package, DollarSign, Tag, FileText, Star, ArchiveRestore } from 'lucide-react';
import { updatePriceBookItem, archivePriceBookItem, reactivatePriceBookItem, toggleFavorite } from '@/app/actions/price-book';
import { addPriceBookItem } from '@/app/actions/price-book';

type Item = {
  id: string;
  name: string;
  price_cents: number;
  unit: string | null;
  trade: string | null;
  description: string | null;
  favorite: boolean;
  active: boolean;
  archived_at: string | null;
  is_optional: boolean;
};

interface Props {
  mode: 'create';
  item?: never;
}
interface EditProps {
  mode: 'edit';
  item: Item;
}

const anim = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const TRADES = ['Pintura', 'Plomería', 'Electricidad', 'HVAC', 'Remodelación', 'Carpintería', 'Techado', 'Pisos', 'Exterior', 'General'];

export function PriceBookItemForm(props: Props | EditProps) {
  const router = useRouter();
  const item = props.mode === 'edit' ? props.item : null;
  const isArchived = !!item?.archived_at;

  const action = props.mode === 'edit'
    ? updatePriceBookItem.bind(null, props.item.id)
    : async (_: string | null, fd: FormData) => {
        const res = await addPriceBookItem(fd);
        if (res.error) return res.error;
        router.push('/app/price-book');
        return null;
      };

  const [error, formAction, pending] = useActionState(action, null);
  const [archiving, startArchive] = useTransition();
  const [starring, startStar] = useTransition();

  function handleArchive() {
    if (!item) return;
    if (!confirm(`¿Archivar "${item.name}"?`)) return;
    startArchive(async () => {
      await archivePriceBookItem(item.id);
      router.push('/app/price-book');
    });
  }

  function handleReactivate() {
    if (!item) return;
    startArchive(async () => {
      await reactivatePriceBookItem(item.id);
      router.refresh();
    });
  }

  function handleToggleFavorite() {
    if (!item) return;
    startStar(async () => { await toggleFavorite(item.id, item.favorite); router.refresh(); });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-4">
        <button onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          {props.mode === 'create' ? 'Agregar servicio' : 'Editar servicio'}
        </h1>
        {item && (
          <button onClick={handleToggleFavorite} disabled={starring}
            className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
            <Star size={20}
              fill={item.favorite ? 'var(--accent)' : 'none'}
              color={item.favorite ? 'var(--accent)' : 'var(--text-tertiary)'} />
          </button>
        )}
        {!item && <div className="w-10" />}
      </header>

      <main className="flex-1 px-5 pt-2 pb-12">
        {/* Archived banner */}
        {isArchived && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
            <ArchiveRestore size={16} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-sm text-amber-700">Este ítem está archivado</p>
            <button onClick={handleReactivate} disabled={archiving}
              className="text-xs font-bold text-amber-700 underline">
              Reactivar
            </button>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Nombre *</label>
            <div className="relative">
              <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input name="name" required defaultValue={item?.name ?? ''}
                placeholder="Ej. Pintura de sala"
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]" />
            </div>
          </div>

          {/* Price + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Precio *</label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input name="price" type="number" min="0" step="0.01" required
                  defaultValue={item ? (item.price_cents / 100).toFixed(2) : ''}
                  placeholder="0.00"
                  className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Unidad</label>
              <input name="unit" defaultValue={item?.unit ?? ''}
                placeholder="hr, m², pie..."
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
            </div>
          </div>

          {/* Trade / Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Categoría</label>
            <div className="relative">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input name="trade" list="trades-list" defaultValue={item?.trade ?? ''}
                placeholder="Pintura, Plomería, HVAC..."
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
              <datalist id="trades-list">
                {TRADES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Descripción</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-[var(--text-tertiary)]" />
              <textarea name="description" rows={3} defaultValue={item?.description ?? ''}
                placeholder="Detalles del servicio, materiales incluidos..."
                className="w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 pt-3 pb-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] resize-none" />
            </div>
          </div>

          {/* Optional item toggle */}
          <label className="flex items-center justify-between rounded-2xl bg-[var(--surface)] px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Ítem opcional</p>
              <p className="text-xs text-[var(--text-tertiary)]">El cliente puede aceptar sin este ítem</p>
            </div>
            <input
              type="checkbox"
              name="is_optional"
              defaultChecked={item?.is_optional ?? false}
              className="h-5 w-5 rounded accent-[var(--accent)]"
            />
          </label>

          {error && (
            <p className="rounded-[var(--radius-button)] bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={pending}
            transition={anim}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-semibold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
            {pending ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : props.mode === 'create' ? 'Agregar servicio' : 'Guardar cambios'}
          </motion.button>

          {/* Archive / Reactivate */}
          {item && !isArchived && (
            <button type="button" onClick={handleArchive} disabled={archiving}
              className="w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-3 text-sm font-semibold text-[var(--text-secondary)]">
              Archivar servicio
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
