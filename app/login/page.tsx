import type { Metadata } from 'next';
import { LoginScreen } from '@/components/auth/LoginScreen';

export const metadata: Metadata = {
  title: 'Crear cuenta — Quotronex',
  robots: { index: false },
};

export default function LoginPage() {
  return <LoginScreen />;
}
