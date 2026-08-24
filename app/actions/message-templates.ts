'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const { data: bizIds } = await supabase.rpc('get_my_business_ids');
  const id = bizIds?.[0];
  if (!id) throw new Error('No business found');
  return id;
}

export async function createMessageTemplate(prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  const body = (formData.get('body') as string ?? '').trim();
  if (!name) return 'El nombre es requerido';
  if (!body) return 'El mensaje es requerido';

  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { error } = await supabase.from('message_templates').insert({ business_id: businessId, name, body });
  if (error) return error.message;

  revalidatePath('/app/settings');
  return null;
}

export async function updateMessageTemplate(id: string, prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  const body = (formData.get('body') as string ?? '').trim();
  if (!name) return 'El nombre es requerido';
  if (!body) return 'El mensaje es requerido';

  const supabase = await createClient();
  const { error } = await supabase.from('message_templates').update({ name, body }).eq('id', id);
  if (error) return error.message;

  revalidatePath('/app/settings');
  return null;
}

export async function deleteMessageTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('message_templates').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app/settings');
  return {};
}
