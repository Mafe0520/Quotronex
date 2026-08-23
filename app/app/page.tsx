import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'Quotronex',
  robots: { index: false },
};

export default async function AppPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get business
  const { data: businessIds } = await supabase.rpc('get_my_business_ids');
  const businessId = businessIds?.[0] ?? null;

  let business = null;
  let quotes: Quote[] = [];
  let priceBookItems: PriceBookItem[] = [];

  if (businessId) {
    const [bizRes, quotesRes, pbRes] = await Promise.all([
      supabase.from('businesses').select('id, name').eq('id', businessId).single(),
      supabase
        .from('quotes')
        .select('id, status, total_cents, created_at, clients(name), quote_items(name)')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('price_book_items')
        .select('id, name, price_cents, unit, trade, active')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('name'),
    ]);

    business = bizRes.data;
    quotes = (quotesRes.data ?? []) as Quote[];
    priceBookItems = (pbRes.data ?? []) as PriceBookItem[];
  }

  const firstName = user.email?.split('@')[0] ?? 'there';

  return (
    <AppShell
      user={{ id: user.id, email: user.email ?? '', firstName }}
      business={business}
      quotes={quotes}
      priceBookItems={priceBookItems}
    />
  );
}

// Types inlined to keep page self-contained
export type Quote = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  clients: { name: string } | null;
  quote_items: { name: string }[];
};

export type PriceBookItem = {
  id: string;
  name: string;
  price_cents: number;
  unit: string | null;
  trade: string | null;
  active: boolean;
};
