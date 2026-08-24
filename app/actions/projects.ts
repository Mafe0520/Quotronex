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

export async function createProject(clientId: string, prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) return 'Project name is required';

  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { error } = await supabase
    .from('projects')
    .insert({
      business_id: businessId,
      client_id: clientId,
      name,
      job_address: (formData.get('job_address') as string ?? '').trim() || null,
      notes: (formData.get('notes') as string ?? '').trim() || null,
      status: (formData.get('status') as string || 'active') as 'lead' | 'active' | 'completed' | 'canceled',
    });

  if (error) return error.message;

  revalidatePath(`/app/customers/${clientId}`);
  redirect(`/app/customers/${clientId}`);
}

export async function updateProject(id: string, clientId: string, prevState: string | null, formData: FormData): Promise<string | null> {
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) return 'Project name is required';

  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({
      name,
      job_address: (formData.get('job_address') as string ?? '').trim() || null,
      notes: (formData.get('notes') as string ?? '').trim() || null,
      status: (formData.get('status') as string || 'active') as 'lead' | 'active' | 'completed' | 'canceled',
    })
    .eq('id', id);

  if (error) return error.message;

  revalidatePath(`/app/customers/${clientId}`);
  redirect(`/app/customers/${clientId}`);
}

export async function archiveProject(id: string, clientId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('projects').update({ archived_at: new Date().toISOString() }).eq('id', id);
  revalidatePath(`/app/customers/${clientId}`);
  revalidatePath(`/app/projects/${id}`);
  redirect(`/app/customers/${clientId}`);
}

export async function reactivateProject(id: string, clientId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('projects').update({ archived_at: null }).eq('id', id);
  revalidatePath(`/app/customers/${clientId}`);
  revalidatePath(`/app/projects/${id}`);
  redirect(`/app/projects/${id}`);
}
