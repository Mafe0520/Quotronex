'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function signUp(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, confirmationRequired: false };

  const userId = data.user?.id;
  if (!userId) return { error: 'No se pudo crear el usuario.', confirmationRequired: false };

  // Bootstrap: create business + owner membership
  const service = await createServiceClient();
  const slug = `biz-${userId.slice(0, 8)}`;
  const { error: bizError } = await service.rpc('create_business_with_owner', {
    p_user_id: userId,
    p_name: 'Mi negocio',
    p_slug: slug,
  });

  if (bizError) {
    // Non-fatal — user exists, business can be created later
    console.error('bootstrap error:', bizError.message);
  }

  // If session is null, Supabase requires email confirmation before login
  const confirmationRequired = data.session === null;
  return { error: null, confirmationRequired };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error.message), redirectTo: null };

  // Check admin_users to determine redirect destination
  const userId = data.user?.id;
  let redirectTo = '/app';
  if (userId) {
    const service = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: admin } = await service
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (admin) redirectTo = '/admin';
  }

  return { error: null, redirectTo };
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: 'No pudimos enviar el correo. Intenta de nuevo.' };
  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: 'No pudimos actualizar la contraseña. Intenta de nuevo.' };
  return { error: null };
}

export async function resendConfirmation(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { error: 'No pudimos reenviar el correo. Intenta de nuevo.' };
  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

function mapAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de ingresar.';
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  return 'Algo salió mal. Intenta de nuevo.';
}
