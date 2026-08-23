'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error.message) };
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
