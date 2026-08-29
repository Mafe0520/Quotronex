'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function getBusinessId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: ids } = await supabase.rpc('get_my_business_ids');
  const businessId = ids?.[0] ?? null;
  if (!businessId) redirect('/app');
  return { supabase, businessId: businessId as string };
}

export async function convertQuoteToJob(quoteId: string) {
  const { supabase, businessId } = await getBusinessId();

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, total_cents, project_id, clients(name), quote_items(name)')
    .eq('id', quoteId)
    .single();

  if (!quote) return { error: 'Cotización no encontrada' };

  const clientName = (quote.clients as { name: string } | null)?.name ?? 'Cliente';
  const firstItem = (quote.quote_items as { name: string }[])[0]?.name;
  const title = firstItem ? `${clientName} — ${firstItem}` : clientName;

  const { data: job, error } = await supabase.from('jobs').insert({
    business_id: businessId,
    quote_id: quoteId,
    project_id: quote.project_id ?? undefined,
    title,
    status: 'scheduled',
  }).select('id').single();

  if (error) return { error: error.message };

  await supabase.from('quotes').update({ status: 'converted' }).eq('id', quoteId);

  revalidatePath('/app');
  revalidatePath(`/app/quotes/${quoteId}`);
  redirect(`/app/jobs/${job.id}`);
}

export async function updateJobStatus(
  jobId: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold' | 'canceled',
) {
  const { supabase } = await getBusinessId();
  const { error } = await supabase.from('jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath(`/app/jobs/${jobId}`);
  return { ok: true };
}

export async function updateJobMeta(jobId: string, data: {
  title?: string;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}) {
  const { supabase } = await getBusinessId();
  const { error } = await supabase.from('jobs').update({ ...data, updated_at: new Date().toISOString() }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath(`/app/jobs/${jobId}`);
  return { ok: true };
}

export async function archiveJob(jobId: string) {
  const { supabase } = await getBusinessId();
  const { error } = await supabase.from('jobs').update({ archived_at: new Date().toISOString() }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/app');
  redirect('/app/jobs');
}

export async function updateJobFlags(jobId: string, flags: string[]): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId();
  const { error } = await supabase.from('jobs').update({ flags, updated_at: new Date().toISOString() }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}

export async function completeJob(jobId: string, data: {
  completion_summary?: string;
  warranty_notes?: string;
}): Promise<{ error?: string }> {
  const { supabase, businessId } = await getBusinessId();
  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single();
  const { error } = await supabase.from('jobs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    completion_summary: data.completion_summary ?? null,
    warranty_notes: data.warranty_notes ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);
  if (error) return { error: error.message };
  const { notifyUsers } = await import('@/lib/push');
  const { data: members } = await supabase.from('business_members').select('user_id').eq('business_id', businessId).in('role', ['owner', 'admin']);
  const userIds = ((members ?? []) as { user_id: string }[]).map((r) => r.user_id);
  notifyUsers({ title: 'Trabajo completado ✅', body: job?.title ?? 'Un trabajo fue marcado como completado', url: `/app/jobs/${jobId}`, user_ids: userIds });
  revalidatePath('/app');
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}

export async function addChangeOrder(jobId: string, data: {
  description: string;
  amount_cents: number;
}): Promise<{ id?: string; error?: string }> {
  const { supabase, businessId } = await getBusinessId();
  const { data: co, error } = await supabase
    .from('change_orders')
    .insert({ job_id: jobId, business_id: businessId, description: data.description, amount_cents: data.amount_cents })
    .select('id').single();
  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return { id: co.id };
}

export async function updateChangeOrderStatus(
  id: string,
  status: 'approved' | 'declined',
): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId();
  const { error } = await supabase.from('change_orders').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app/jobs');
  return {};
}

export async function deleteJobPhoto(photoId: string, jobId: string): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId();
  const { data: photo } = await supabase.from('job_photos').select('url').eq('id', photoId).single();
  if (photo) {
    const path = photo.url.split('/job-photos/')[1];
    if (path) await supabase.storage.from('job-photos').remove([path]);
  }
  await supabase.from('job_photos').delete().eq('id', photoId);
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}

export async function createStandaloneJob(clientId: string, clientName: string): Promise<{ jobId?: string; error?: string }> {
  const { supabase, businessId } = await getBusinessId();
  const { data: job, error } = await supabase.from('jobs').insert({
    business_id: businessId,
    title: clientName,
    status: 'scheduled',
  }).select('id').single();
  if (error) return { error: error.message };
  revalidatePath('/app');
  revalidatePath('/app/jobs');
  redirect(`/app/jobs/${job.id}`);
}
