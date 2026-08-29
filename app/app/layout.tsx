import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids')
  const businessId = bizIds?.[0] as string | null
  if (!businessId) redirect('/onboarding')

  return <>{children}</>;
}
