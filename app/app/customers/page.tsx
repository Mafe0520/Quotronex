import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CustomerList } from '@/components/app/customers/CustomerList';
import { AppPageHeader } from '@/components/app/AppPageHeader';

export const metadata = { title: 'Customers — Quotronex' };

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const businessId = bizIds?.[0];

  const customers = businessId
    ? (await supabase
        .from('clients')
        .select('id, name, email, phone, projects(id, archived_at)')
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('name')
      ).data ?? []
    : [];

  return (
    <div className="flex flex-col min-h-dvh">
      <AppPageHeader section="customers" newHref="/app/customers/new" />

      <CustomerList customers={customers as Parameters<typeof CustomerList>[0]['customers']} />
    </div>
  );
}
