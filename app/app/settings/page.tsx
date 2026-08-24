import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsScreen } from '@/components/app/SettingsScreen';
import type { MemberRole } from '@/lib/permissions';

export const metadata = { title: 'Ajustes — Quotronex' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0] ?? null;

  const [businessRes, membersRes, invitesRes, callerRes] = await Promise.all([
    businessId
      ? supabase.from('businesses').select('id, name, phone, email, address, website, tagline, logo_url, default_tax_pct, default_deposit_pct, default_payment_terms, lang').eq('id', businessId).single()
      : { data: null },
    businessId
      ? supabase.from('business_members').select('id, user_id, role, name, email, accepted_at').eq('business_id', businessId).order('role')
      : { data: [] },
    businessId
      ? supabase.from('team_invites').select('id, email, name, role, expires_at, accepted_at').eq('business_id', businessId).order('created_at', { ascending: false })
      : { data: [] },
    businessId
      ? supabase.from('business_members').select('role').eq('business_id', businessId).eq('user_id', user.id).single()
      : { data: null },
  ]);

  return (
    <SettingsScreen
      user={{ email: user.email ?? '', id: user.id }}
      business={businessRes.data}
      members={(membersRes.data ?? []) as any[]}
      invites={(invitesRes.data ?? []) as any[]}
      callerRole={(callerRes.data?.role ?? 'field_worker') as MemberRole}
    />
  );
}
