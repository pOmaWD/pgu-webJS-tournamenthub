export type Role = 'organizer' | 'captain' | 'referee';

export const roleLabels: Record<Role, string> = {
  organizer: 'организатор',
  captain: 'капитан',
  referee: 'судья',
};

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: Role;
}

export type TournamentStatus = 'draft' | 'scheduled' | 'finished';

export const statusLabels: Record<TournamentStatus, string> = {
  draft: 'набор команд',
  scheduled: 'расписание создано',
  finished: 'завершён',
};

export interface Tournament {
  _id: string;
  name: string;
  description: string;
  status: TournamentStatus;
  settings: { maxTeams: number; location: string };
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
