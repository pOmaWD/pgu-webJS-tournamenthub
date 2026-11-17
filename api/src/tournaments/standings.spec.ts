import { calculateStandings } from './standings';

const teams = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' },
];

describe('calculateStandings', () => {
  it('начисляет 3 очка за победу, 1 за ничью, 0 за поражение', () => {
    const rows = calculateStandings(teams, [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: 2, awayScore: 1 },
      { homeTeamId: 'c', awayTeamId: 'd', homeScore: 1, awayScore: 1 },
    ]);
    const byId = Object.fromEntries(rows.map((r) => [r.teamId, r]));
    expect(byId.a.points).toBe(3);
    expect(byId.b.points).toBe(0);
    expect(byId.c.points).toBe(1);
    expect(byId.d.points).toBe(1);
  });

  it('считает разность мячей и сортирует по очкам и разности', () => {
    const rows = calculateStandings(teams, [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 0 },
      { homeTeamId: 'c', awayTeamId: 'd', homeScore: 4, awayScore: 0 },
    ]);
    expect(rows.map((r) => r.teamId)).toEqual(['c', 'a', 'b', 'd']);
    expect(rows[0].goalDiff).toBe(4);
    expect(rows[3].goalDiff).toBe(-4);
  });

  it('команды с равными очками и разностью делят место', () => {
    const rows = calculateStandings(teams, [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: 1, awayScore: 1 },
      { homeTeamId: 'c', awayTeamId: 'd', homeScore: 1, awayScore: 1 },
    ]);
    expect(rows.map((r) => r.place)).toEqual([1, 1, 1, 1]);
  });

  it('исправленный счёт заменяет прежний вклад и не удваивает очки', () => {
    const before = calculateStandings(teams, [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: 2, awayScore: 1 },
    ]);
    const after = calculateStandings(teams, [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: 0, awayScore: 3 },
    ]);
    const pointsOf = (rows: typeof before, id: string) =>
      rows.find((r) => r.teamId === id)!.points;
    expect(pointsOf(before, 'a')).toBe(3);
    expect(pointsOf(before, 'b')).toBe(0);
    expect(pointsOf(after, 'a')).toBe(0);
    expect(pointsOf(after, 'b')).toBe(3);
    expect(after.reduce((sum, r) => sum + r.points, 0)).toBe(3);
  });
});