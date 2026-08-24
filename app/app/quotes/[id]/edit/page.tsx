import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuoteEditForm } from '@/components/app/quotes/QuoteEditForm';

export const metadata = { title: 'Editar cotización — Quotronex' };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: quote }, { data: items }, { data: priceBook }] = await Promise.all([
    supabase.from('quotes').select('id, status, notes, expires_at, clients(id, name)').eq('id', id).single(),
    supabase.from('quote_items').select('id, name, description, qty, unit_price_cents, unit, price_book_item_id').eq('quote_id', id).order('sort_order'),
    supabase.from('price_book_items').select('id, name, price_cents, unit, trade').is('archived_at', null).eq('active', true).order('name'),
  ]);

  if (!quote) notFound();
  if (quote.status !== 'draft') redirect(`/app/quotes/${id}`);

  return <QuoteEditForm quoteId={id} initial={{ notes: quote.notes ?? '', expires_at: quote.expires_at ?? '' }} items={items ?? []} priceBook={priceBook ?? []} />;
}
