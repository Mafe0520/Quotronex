import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CustomerForm } from '@/components/app/customers/CustomerForm';

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Customer — Quotronex' };

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.from('clients').select('name, email, phone, address, notes, tags, contact_pref').eq('id', id).single();
  if (!data) notFound();

  return <CustomerForm mode="edit" customerId={id} initial={data} />;
}
