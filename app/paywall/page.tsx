import type { Metadata } from 'next';
import { PaywallScreen } from '@/components/onboarding/PaywallScreen';

export const metadata: Metadata = {
  title: 'Elige tu plan — Quotronex',
  robots: { index: false },
};

export default function PaywallPage() {
  return <PaywallScreen />;
}
