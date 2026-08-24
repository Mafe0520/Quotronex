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

export async function addJobNote(jobId: string, body: string, isPrivate: boolean): Promise<{ error?: string }> {
  if (!body.trim()) return { error: 'La nota no puede estar vacía' };
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('job_notes').insert({
    job_id: jobId,
    business_id: businessId,
    author_id: user?.id ?? null,
    body: body.trim(),
    is_private: isPrivate,
  });

  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}

export async function deleteJobNote(noteId: string, jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('job_notes').delete().eq('id', noteId);
  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}
