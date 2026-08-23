import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectForm } from '@/components/app/projects/ProjectForm';

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'New Project — Quotronex' };

export default async function NewProjectPage({ params }: Props) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single();
  if (!client) notFound();

  return <ProjectForm mode="create" clientId={clientId} clientName={client.name} />;
}
