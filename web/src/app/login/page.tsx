'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setFields({});
    try {
      await login(email, password);
      router.push('/');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields ?? {});
      } else {
        setError('Неизвестная ошибка');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h1>Вход</h1>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={Boolean(fields.email)}
        required
      />
      {fields.email && <span className="field-error">{fields.email}</span>}

      <label htmlFor="password">Пароль (не короче 10 символов)</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={Boolean(fields.password)}
        required
      />
      {fields.password && <span className="field-error">{fields.password}</span>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Входим...' : 'Войти'}
      </button>
    </form>
  );
}
