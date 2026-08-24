'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const id = bizIds?.[0];
  if (!id) throw new Error('No business found');
  return id;
}

export async function createCustomer(prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) return 'Name is required';

  const supabase = await createClient();
  const businessId = await getBusinessId();

  const rawTags = (formData.get('tags') as string ?? '').trim();
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const { data, error } = await supabase
    .from('clients')
    .insert({
      business_id: businessId,
      name,
      email: (formData.get('email') as string ?? '').trim() || null,
      phone: (formData.get('phone') as string ?? '').trim() || null,
      address: (formData.get('address') as string ?? '').trim() || null,
      notes: (formData.get('notes') as string ?? '').trim() || null,
      tags,
      contact_pref: (formData.get('contact_pref') as string) || 'any',
    })
    .select('id')
    .single();

  if (error || !data) return error?.message ?? 'Failed to create customer';

  revalidatePath('/app/customers');
  redirect(`/app/customers/${data.id}`);
}

export async function updateCustomer(id: string, prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) return 'Name is required';

  const supabase = await createClient();
  const rawTags = (formData.get('tags') as string ?? '').trim();
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const { error } = await supabase
    .from('clients')
    .update({
      name,
      email: (formData.get('email') as string ?? '').trim() || null,
      phone: (formData.get('phone') as string ?? '').trim() || null,
      address: (formData.get('address') as string ?? '').trim() || null,
      notes: (formData.get('notes') as string ?? '').trim() || null,
      tags,
      contact_pref: (formData.get('contact_pref') as string) || 'any',
    })
    .eq('id', id);

  if (error) return error.message;

  revalidatePath(`/app/customers/${id}`);
  revalidatePath('/app/customers');
  redirect(`/app/customers/${id}`);
}

export async function archiveCustomer(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('clients').update({ archived_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/app/customers');
  redirect('/app/customers');
}

export async function reactivateCustomer(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('clients').update({ archived_at: null }).eq('id', id);
  revalidatePath('/app/customers');
  revalidatePath(`/app/customers/${id}`);
  redirect(`/app/customers/${id}`);
}
