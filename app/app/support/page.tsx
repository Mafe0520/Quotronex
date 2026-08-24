import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupportList } from '@/components/app/support/SupportList';

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ids } = await supabase.rpc('get_my_business_ids');
  const businessId = ids?.[0] as string | null;
  if (!businessId) redirect('/app');

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, created_at, updated_at')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });

  return <SupportList tickets={tickets ?? []} />;
}
