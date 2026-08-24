import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_STATUSES = ['trialing', 'active', 'past_due']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get business
  const { data: bizIds } = await supabase.rpc('get_my_business_ids')
  const businessId = bizIds?.[0] as string | null

  if (!businessId) redirect('/onboarding')

  // Field workers are invited members — subscription belongs to the business owner
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  const isFieldWorker = membership?.role === 'field_worker'

  if (!isFieldWorker) {
    // Check subscription — only owners/admins are gated
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('business_id', businessId)
      .single()

    const hasAccess = sub && ACTIVE_STATUSES.includes(sub.status)
    if (!hasAccess) redirect('/paywall')
  }

  return <>{children}</>;
}
