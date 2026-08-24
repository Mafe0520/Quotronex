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

  // Redirect field workers to their simplified view
  if (businessId) {
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single();
    if (membership?.role === 'field_worker') redirect('/app/worker');
  }

  let business = null;
  let quotes: Quote[] = [];
  let priceBookItems: PriceBookItem[] = [];
  let invoices: InvoiceRow[] = [];
  let jobs: JobRow[] = [];
  let clientCount = 0;

  if (businessId) {
    const [bizRes, quotesRes, pbRes, invRes, jobsRes, clientsRes] = await Promise.all([
      supabase.from('businesses').select('id, name, phone, email, logo_url').eq('id', businessId).single(),
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
      supabase
        .from('invoices')
        .select('id, status, total_cents, amount_paid_cents, due_at, issued_at, updated_at, clients(name), projects(name), quote_id')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('jobs')
        .select('id, title, status, start_date, quotes(clients(name))')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_id', businessId).is('archived_at', null),
    ]);

    business = bizRes.data;
    quotes = (quotesRes.data ?? []) as Quote[];
    priceBookItems = (pbRes.data ?? []) as PriceBookItem[];
    invoices = (invRes.data ?? []) as InvoiceRow[];
    jobs = (jobsRes.data ?? []) as JobRow[];
    clientCount = clientsRes.count ?? 0;
  }

  const firstName = user.email?.split('@')[0] ?? 'there';

  return (
    <AppShell
      user={{ id: user.id, email: user.email ?? '', firstName }}
      business={business}
      quotes={quotes}
      priceBookItems={priceBookItems}
      invoices={invoices}
      jobs={jobs}
      clientCount={clientCount}
    />
  );
}

// Types inlined to keep page self-contained
export type Business = { id: string; name: string; phone: string | null; email: string | null; logo_url: string | null };

export type JobRow = {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
  quotes: { clients: { name: string } | null } | null;
};

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

export type InvoiceRow = {
  id: string;
  status: string;
  total_cents: number;
  amount_paid_cents: number;
  due_at: string | null;
  issued_at: string | null;
  updated_at: string;
  clients: { name: string } | null;
  projects: { name: string } | null;
  quote_id: string | null;
};
