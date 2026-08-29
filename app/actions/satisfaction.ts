'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitSatisfactionRating(
  rating: number,
  businessId: string | null,
): Promise<{ ok?: boolean; error?: string }> {
  if (rating < 1 || rating > 5) return { error: 'Rating inválido' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('satisfaction_ratings').insert({
    user_id: user.id,
    business_id: businessId ?? null,
    rating,
  })
  if (error) return { error: error.message }
  return { ok: true }
}
