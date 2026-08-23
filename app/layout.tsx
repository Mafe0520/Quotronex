import type { Metadata } from 'next';
import { Archivo_Black, Work_Sans } from 'next/font/google';
import './globals.css';
import { LangProvider } from './lang-context';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Quotronex — Quote in 30 seconds. Land the job.',
  description:
    'The Voice Price Book generates a professional estimate using your own rates in 30 seconds. Built for contractors with 1–15 employees. English + Spanish.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${workSans.variable} h-full antialiased`}
      style={
        {
          '--font-display': 'var(--font-archivo-black), "Helvetica Neue", sans-serif',
          '--font-body': 'var(--font-work-sans), "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
      <body className="min-h-dvh flex flex-col">
          <LangProvider>{children}</LangProvider>
        </body>
    </html>
  );
}
