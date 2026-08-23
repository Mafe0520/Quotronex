import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsView } from '@/components/app/SettingsView';
import { AppPageHeader } from '@/components/app/AppPageHeader';

export const metadata = { title: 'Settings — Quotronex' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0];

  const business = businessId
    ? (await supabase.from('businesses').select('id, name').eq('id', businessId).single()).data
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppPageHeader section="settings" />
      <SettingsView user={{ email: user.email ?? '' }} business={business} />
    </div>
  );
}
