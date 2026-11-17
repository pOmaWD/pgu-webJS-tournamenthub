'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { roleLabels } from '@/lib/types';

export default function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <nav className="nav">
      <Link href="/">Турниры</Link>
      <span className="spacer" />
      {user ? (
        <>
          <span>
            {user.displayName} ({roleLabels[user.role]})
          </span>
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </>
      ) : (
        <Link href="/login">Войти</Link>
      )}
    </nav>
  );
}
