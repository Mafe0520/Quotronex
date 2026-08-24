import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectForm } from '@/components/app/projects/ProjectForm';

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Project — Quotronex' };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('projects')
    .select('name, job_address, status, notes, client_id, clients(name)')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const client = data.clients as { name: string } | null;

  return (
    <ProjectForm
      mode="edit"
      projectId={id}
      clientId={data.client_id}
      clientName={client?.name ?? ''}
      initial={{ name: data.name, job_address: data.job_address, status: data.status, notes: data.notes ?? null }}
    />
  );
}
