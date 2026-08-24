'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] as string | null
  if (!businessId) redirect('/app')
  return { supabase, user, businessId }
}

export type ExpenseDraft = {
  description: string
  amount_cents: number
  category: string
  vendor?: string
  expense_date?: string
  receipt_url?: string
}

export async function addExpense(jobId: string, data: ExpenseDraft): Promise<{ id?: string; error?: string }> {
  const { supabase, user, businessId } = await getContext()
  const { data: exp, error } = await supabase
    .from('expenses')
    .insert({
      job_id: jobId,
      business_id: businessId,
      user_id: user.id,
      description: data.description,
      amount_cents: data.amount_cents,
      category: data.category,
      vendor: data.vendor ?? null,
      expense_date: data.expense_date ?? new Date().toISOString().slice(0, 10),
      receipt_url: data.receipt_url ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/app/jobs/${jobId}`)
  return { id: exp.id }
}

export async function deleteExpense(expenseId: string, jobId: string): Promise<{ error?: string }> {
  const { supabase } = await getContext()
  const { data: exp } = await supabase.from('expenses').select('receipt_url').eq('id', expenseId).single()
  if (exp?.receipt_url) {
    const path = exp.receipt_url.split('/receipts/')[1]
    if (path) await supabase.storage.from('receipts').remove([path])
  }
  await supabase.from('expenses').delete().eq('id', expenseId)
  revalidatePath(`/app/jobs/${jobId}`)
  return {}
}
