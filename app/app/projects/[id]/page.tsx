import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectDetailClient } from '@/components/app/projects/ProjectDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('projects').select('name').eq('id', id).single();
  return { title: data?.name ? `${data.name} — Quotronex` : 'Project' };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectRes, quotesRes, invoicesRes, paymentsRes, jobsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, job_address, status, notes, archived_at, client_id, clients(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('quotes')
      .select('id, status, total_cents, created_at, accepted_at, quote_items(name)')
      .eq('project_id', id)
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, status, total_cents, amount_paid_cents, due_at, issued_at')
      .eq('project_id', id)
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount_cents, method, paid_at, notes')
      .eq('project_id', id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, title, status, start_date, end_date')
      .eq('project_id', id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  if (!projectRes.data) notFound();

  const project = projectRes.data;
  const client = project.clients as { id: string; name: string } | null;

  return (
    <ProjectDetailClient
      id={id}
      name={project.name}
      status={project.status as 'lead' | 'active' | 'completed' | 'canceled'}
      jobAddress={project.job_address}
      notes={project.notes ?? null}
      archived_at={project.archived_at}
      client={client}
      quotes={(quotesRes.data ?? []) as any}
      invoices={(invoicesRes.data ?? []) as any}
      payments={(paymentsRes.data ?? []) as any}
      jobs={(jobsRes.data ?? []) as any}
    />
  );
}
