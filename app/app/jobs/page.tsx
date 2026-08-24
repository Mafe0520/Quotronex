import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobsListClient } from '@/components/app/jobs/JobsListClient';

export const metadata = { title: 'Trabajos — Quotronex' };

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ids } = await supabase.rpc('get_my_business_ids');
  const businessId = ids?.[0] ?? null;
  if (!businessId) redirect('/app');

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, start_date, end_date, created_at, quotes(total_cents, clients(name))')
    .eq('business_id', businessId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  return <JobsListClient jobs={jobs ?? []} />;
}
