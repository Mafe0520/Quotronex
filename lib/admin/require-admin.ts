import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type AdminRole = 'superadmin' | 'support'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: AdminRole
}

/**
 * requireAdmin() — llamar como PRIMERA línea en toda página, server action
 * y API route bajo /admin. Si falla → 404 (no revela que la ruta existe).
 *
 * Dos capas de verificación:
 * 1. Sesión de Supabase Auth válida
 * 2. user_id existe en admin_users (tabla solo accesible con service role)
 */
export async function requireAdmin(): Promise<AdminUser> {
  // Capa 1 — sesión auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Capa 2 — verificación en admin_users vía service role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = await createServiceClient() as any
  const { data: admin, error } = await service
    .from('admin_users')
    .select('id, user_id, email, role')
    .eq('user_id', user.id)
    .single()

  if (error || !admin) notFound()

  return admin as AdminUser
}

/**
 * logAdminAction() — registrar acción sensible en audit log.
 * Llamar después de toda mutación desde el admin.
 */
export async function logAdminAction({
  adminUserId,
  action,
  targetType,
  targetId,
  before,
  after,
}: {
  adminUserId: string
  action: string
  targetType: string
  targetId?: string
  before?: object
  after?: object
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = await createServiceClient() as any
  await service.from('admin_audit_log').insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    before_json: before ?? null,
    after_json: after ?? null,
  })
}
