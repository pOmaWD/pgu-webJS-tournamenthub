export interface StandingTeam {
  id: string;
  name: string;
}

export interface FinishedMatch {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

export interface StandingRow {
  place: number;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export const POINTS = { win: 3, draw: 1, loss: 0 };

export function calculateStandings(
  teams: StandingTeam[],
  matches: FinishedMatch[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      place: 0,
      teamId: t.id,
      teamName: t.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    const home = rows.get(m.homeTeamId);
    const away = rows.get(m.awayTeamId);
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      home.wins++;
      away.losses++;
      home.points += POINTS.win;
      away.points += POINTS.loss;
    } else if (m.homeScore < m.awayScore) {
      away.wins++;
      home.losses++;
      away.points += POINTS.win;
      home.points += POINTS.loss;
    } else {
      home.draws++;
      away.draws++;
      home.points += POINTS.draw;
      away.points += POINTS.draw;
    }
  }

  const sorted = [...rows.values()]
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        a.teamId.localeCompare(b.teamId),
    );

  sorted.forEach((row, i) => {
    const prev = sorted[i - 1];
    row.place =
      prev && prev.points === row.points && prev.goalDiff === row.goalDiff
        ? prev.place
        : i + 1;
  });

  return sorted;
}