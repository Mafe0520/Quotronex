'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveBusinessProfileOnboarding(data: {
  name: string; phone?: string; address?: string; website?: string; tagline?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0]
  if (!businessId) return { error: 'No se encontró el negocio' }

  const { error } = await supabase.from('businesses').update({
    name:    data.name.trim(),
    phone:   data.phone?.trim() || null,
    address: data.address?.trim() || null,
    website: data.website?.trim() || null,
    tagline: data.tagline?.trim() || null,
  }).eq('id', businessId)

  if (error) return { error: error.message }
  return {}
}

export async function updateBusinessProfile(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0]
  if (!businessId) return 'No se encontró el negocio'

  const { error } = await supabase.from('businesses').update({
    name:     (formData.get('name')     as string ?? '').trim() || undefined,
    phone:    (formData.get('phone')    as string ?? '').trim() || null,
    email:    (formData.get('email')    as string ?? '').trim() || null,
    address:  (formData.get('address')  as string ?? '').trim() || null,
    website:  (formData.get('website')  as string ?? '').trim() || null,
    tagline:  (formData.get('tagline')  as string ?? '').trim() || null,
    logo_url: (formData.get('logo_url') as string ?? '').trim() || null,
  }).eq('id', businessId)

  if (error) return error.message
  revalidatePath('/app/settings')
  revalidatePath('/app')
  return null
}

export async function updateBusinessDefaults(data: {
  default_tax_pct: number
  default_deposit_pct: number
  default_payment_terms: string
  lang: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0]
  if (!businessId) return { error: 'No se encontró el negocio' }

  const { error } = await supabase.from('businesses').update({
    default_tax_pct: data.default_tax_pct,
    default_deposit_pct: data.default_deposit_pct,
    default_payment_terms: data.default_payment_terms,
    lang: data.lang,
  }).eq('id', businessId)

  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return {}
}

export async function changePassword(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const newPassword = (formData.get('password') as string ?? '').trim()
  const confirm    = (formData.get('confirm')  as string ?? '').trim()

  if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (newPassword !== confirm) return 'Las contraseñas no coinciden'

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return error.message
  return null
}
