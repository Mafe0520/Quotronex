import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupportThread } from '@/components/app/support/SupportThread';

export default async function SupportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase.from('support_tickets').select('id, subject, status, priority, created_at').eq('id', id).single(),
    supabase.from('support_messages').select('id, sender, body, created_at').eq('ticket_id', id).order('created_at'),
  ]);

  if (!ticket) notFound();

  return <SupportThread ticket={ticket} messages={messages ?? []} userId={user.id} />;
}
