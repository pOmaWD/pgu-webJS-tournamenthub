import { Role } from '../users/user.schema';

export interface AuthUser {
  id: string;
  role: Role;
  displayName: string;
  email: string;
}