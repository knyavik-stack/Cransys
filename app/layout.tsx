import type {Metadata} from 'next';
import './globals.css';
import { UserProvider } from '@/lib/auth/user-context';

export const metadata: Metadata = {
  title: 'Cransys — Автоматизированный аудит Яндекс.Директ',
  description: 'Автоматизированный независимый аудит рекламных кабинетов Яндекс.Директ для микробизнеса за 2 минуты.',
  openGraph: {
    title: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    description: 'Автоматизированный независимый аудит рекламных кабинетов Яндекс.Директ для микробизнеса за 2 минуты.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    description: 'Автоматизированный независимый аудит рекламных кабинетов Яндекс.Директ для микробизнеса за 2 минуты.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}

