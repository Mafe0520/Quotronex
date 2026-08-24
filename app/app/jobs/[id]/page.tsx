import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobDetailClient } from '@/components/app/jobs/JobDetailClient';
import { PERMISSIONS, type MemberRole } from '@/lib/permissions';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0] ?? null;

  const [{ data: job }, { data: rawPhotos }, { data: changeOrders }, { data: expenses }, { data: timeEntries }, { data: jobNotes }, { data: callerMember }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, status, notes, start_date, end_date, created_at, archived_at, quote_id, flags, completion_summary, warranty_notes, completed_at, quotes(id, total_cents, clients(id, name, phone, email))')
      .eq('id', id)
      .single(),
    supabase
      .from('job_photos')
      .select('id, url, phase, caption, created_at')
      .eq('job_id', id)
      .order('created_at'),
    supabase
      .from('change_orders')
      .select('id, description, amount_cents, status, created_at')
      .eq('job_id', id)
      .order('created_at'),
    supabase
      .from('expenses')
      .select('id, description, amount_cents, category, vendor, expense_date, receipt_url')
      .eq('job_id', id)
      .order('expense_date', { ascending: false }),
    supabase
      .from('time_entries')
      .select('id, worker_name, clocked_in_at, clocked_out_at, status')
      .eq('job_id', id)
      .order('clocked_in_at', { ascending: false }),
    supabase
      .from('job_notes')
      .select('id, body, is_private, created_at, author_id')
      .eq('job_id', id)
      .order('created_at', { ascending: false }),
    businessId
      ? supabase.from('business_members').select('role').eq('business_id', businessId).eq('user_id', user.id).single()
      : { data: null },
  ]);

  if (!job) notFound();

  let quoteItems: { id: string; name: string; description: string | null; qty: number; unit_price_cents: number; unit: string | null }[] = [];
  if (job.quote_id) {
    const { data } = await supabase.from('quote_items').select('id, name, description, qty, unit_price_cents, unit').eq('quote_id', job.quote_id).order('sort_order');
    quoteItems = data ?? [];
  }

  const photos = (rawPhotos ?? []) as { id: string; url: string; phase: 'before' | 'during' | 'after'; caption: string | null; created_at: string }[];

  const callerRole = (callerMember?.role ?? 'field_worker') as MemberRole;
  const canSeePrivate = PERMISSIONS.canManageFinances(callerRole);

  return (
    <JobDetailClient
      job={{ ...job, flags: (job.flags as string[]) ?? [] }}
      quoteItems={quoteItems}
      photos={photos}
      changeOrders={(changeOrders ?? []) as { id: string; description: string; amount_cents: number; status: 'pending' | 'approved' | 'declined'; created_at: string }[]}
      expenses={expenses ?? []}
      timeEntries={timeEntries ?? []}
      jobNotes={(jobNotes ?? []) as { id: string; body: string; is_private: boolean; created_at: string; author_id: string | null }[]}
      canSeePrivate={canSeePrivate}
    />
  );
}
