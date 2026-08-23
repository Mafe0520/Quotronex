import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/app/AppNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-16">
        {children}
      </div>
      <AppNav />
    </div>
  );
}
