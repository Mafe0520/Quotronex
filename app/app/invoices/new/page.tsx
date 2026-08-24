import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewInvoiceForm } from '@/components/app/invoices/NewInvoiceForm';

export const metadata = { title: 'Nueva factura — Quotronex' };

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ids } = await supabase.rpc('get_my_business_ids');
  const businessId = ids?.[0] ?? null;
  if (!businessId) redirect('/app');

  const [{ data: clients }, { data: priceBook }] = await Promise.all([
    supabase.from('clients').select('id, name, phone, email').eq('business_id', businessId).is('archived_at', null).order('name'),
    supabase.from('price_book_items').select('id, name, price_cents, unit').eq('business_id', businessId).is('archived_at', null).eq('active', true).order('name'),
  ]);

  return <NewInvoiceForm clients={clients ?? []} priceBook={priceBook ?? []} />;
}
