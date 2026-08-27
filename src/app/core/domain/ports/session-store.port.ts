import { Session } from "../models/auth.model";

export interface SessionStore {
  read(): Session | null;
  save(session: Session): void;
  clear(): void;
}