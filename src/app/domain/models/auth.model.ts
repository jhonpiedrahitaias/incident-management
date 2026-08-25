import { User } from './user.model';

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly token: string;
  readonly user: User;
  readonly expiresAt: number;
}

export interface Session {
  readonly token: string;
  readonly user: User;
  readonly expiresAt: number;
}