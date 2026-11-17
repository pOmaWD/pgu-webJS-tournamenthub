'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Page, statusLabels, Tournament, TournamentStatus } from '@/lib/types';

type ViewState = 'loading' | 'success' | 'empty' | 'error' | 'forbidden';

const LIMIT = 10;

export default function CatalogPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Page<Tournament> | null>(null);
  const [state, setState] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TournamentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set('status', status);
    if (query) params.set('q', query);
    try {
      const result = await api<Page<Tournament>>(`/tournaments?${params.toString()}`);
      setData(result);
      setState(result.items.length === 0 ? 'empty' : 'success');
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setState('forbidden');
      } else {
        setErrorMessage(e instanceof ApiError ? e.message : 'Неизвестная ошибка');
        setState('error');
      }
    }
  }, [page, status, query]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  if (!user) {
    return (
      <div className="card">
        <h1>Каталог турниров</h1>
        <p>
          Чтобы увидеть турниры, <Link href="/login">войдите в систему</Link>.
        </p>
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <h1>Каталог турниров</h1>

      <form className="filters" onSubmit={handleSearch}>
        <label htmlFor="search">Поиск по названию</label>
        <input
          id="search"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label htmlFor="status">Статус</label>
        <select
          id="status"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as TournamentStatus | '');
          }}
        >
          <option value="">Все</option>
          <option value="draft">{statusLabels.draft}</option>
          <option value="scheduled">{statusLabels.scheduled}</option>
          <option value="finished">{statusLabels.finished}</option>
        </select>
        <button type="submit">Найти</button>
      </form>

      {state === 'loading' && <p>Загрузка...</p>}
      {state === 'empty' && <p>Турниров по этим условиям нет.</p>}
      {state === 'forbidden' && <p className="alert">У вас нет доступа к каталогу.</p>}
      {state === 'error' && (
        <div className="alert" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={load}>
            Повторить
          </button>
        </div>
      )}

      {state === 'success' && data && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Место</th>
                  <th>Команд (максимум)</th>
                  <th>Статус</th>
                  <th>Создан (Asia/Almaty)</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t._id}>
                    <td>{t.name}</td>
                    <td>{t.settings.location || 'не указано'}</td>
                    <td>{t.settings.maxTeams}</td>
                    <td>{statusLabels[t.status]}</td>
                    <td>
                      {new Date(t.createdAt).toLocaleString('ru-RU', {
                        timeZone: 'Asia/Almaty',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Назад
            </button>
            <span>
              Страница {data.page} из {totalPages} (всего: {data.total})
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Вперёд
            </button>
          </div>
        </>
      )}
    </div>
  );
}
