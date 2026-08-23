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

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, job_address, status, created_at, client_id, clients(id, name)')
    .eq('id', id)
    .single();

  if (!project) notFound();

  const client = project.clients as { id: string; name: string } | null;

  return (
    <ProjectDetailClient
      id={id}
      name={project.name}
      status={project.status}
      jobAddress={project.job_address}
      client={client}
    />
  );
}
