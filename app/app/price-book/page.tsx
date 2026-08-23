import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PriceBookView } from '@/components/app/PriceBookView';
import { AppPageHeader } from '@/components/app/AppPageHeader';

export const metadata = { title: 'Price Book — Quotronex' };

export default async function PriceBookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0];

  const items = businessId
    ? (await supabase
        .from('price_book_items')
        .select('id, name, price_cents, unit, trade, active')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('name')
      ).data ?? []
    : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <AppPageHeader section="priceBook" />
      <PriceBookView items={items} />
    </div>
  );
}
