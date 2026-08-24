import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/app';

  const supabase = await createClient();

  // Flujo PKCE (OAuth, magic link) — parámetro: code
  const code = searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Flujo OTP (confirmación de email, magic link OTP) — parámetros: token_hash + type
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const destination = type === 'recovery' ? '/reset-password' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Falló — link inválido o expirado
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('El enlace expiró o ya fue usado. Intenta ingresar directamente o crea una cuenta nueva.')}`,
  );
}
