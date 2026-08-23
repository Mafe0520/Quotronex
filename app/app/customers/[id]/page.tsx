import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CustomerDetail } from '@/components/app/customers/CustomerDetail';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('name').eq('id', id).single();
  return { title: data ? `${data.name} — Quotronex` : 'Customer — Quotronex' };
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [clientRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('id, name, email, phone, notes').eq('id', id).single(),
    supabase
      .from('projects')
      .select('id, name, job_address, status, archived_at, created_at')
      .eq('client_id', id)
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
  ]);

  if (!clientRes.data) notFound();

  return (
    <CustomerDetail
      customer={clientRes.data}
      projects={projectsRes.data ?? []}
    />
  );
}
