import { AppNav } from '@/components/app/AppNav';

export default function PriceBookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-16">{children}</div>
      <AppNav />
    </div>
  );
}
