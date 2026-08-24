import type { Metadata } from 'next';
import { SignupScreen } from '@/components/auth/SignupScreen';

export const metadata: Metadata = {
  title: 'Create account — Quotronex',
  robots: { index: false },
};

export default function SignupPage() {
  return <SignupScreen />;
}
