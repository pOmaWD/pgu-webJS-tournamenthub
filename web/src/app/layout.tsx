import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TournamentHub',
  description: 'Учёт спортивного турнира',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <Nav />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
