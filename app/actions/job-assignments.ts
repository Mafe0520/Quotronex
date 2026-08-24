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

export async function assignUserToJob(jobId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const { error } = await supabase.from('job_assignments').upsert({
    job_id: jobId,
    business_id: businessId,
    user_id: userId,
  }, { onConflict: 'job_id,user_id' });
  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}

export async function unassignUserFromJob(assignmentId: string, jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('job_assignments').delete().eq('id', assignmentId);
  if (error) return { error: error.message };
  revalidatePath(`/app/jobs/${jobId}`);
  return {};
}
