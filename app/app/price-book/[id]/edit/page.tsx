import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PriceBookItemForm } from '@/components/app/PriceBookItemForm';

export const metadata = { title: 'Editar servicio — Quotronex' };

export default async function EditPriceBookItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('price_book_items')
    .select('id, name, price_cents, unit, trade, description, favorite, is_optional, active, archived_at')
    .eq('id', id)
    .single();

  if (!data) notFound();

  return <PriceBookItemForm mode="edit" item={data} />;
}
