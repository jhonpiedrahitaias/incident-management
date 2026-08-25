import { User } from "../models/user.model";

export interface UserRepository {
  getAll(): readonly User[];

  /** Un usuario por su identificador. `undefined` si no existe. */
  getById(id: string): User | undefined;
}