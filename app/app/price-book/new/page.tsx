import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PriceBookItemForm } from '@/components/app/PriceBookItemForm';

export const metadata = { title: 'Agregar servicio — Quotronex' };

export default async function NewPriceBookItemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <PriceBookItemForm mode="create" />;
}
