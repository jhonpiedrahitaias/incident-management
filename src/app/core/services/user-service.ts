import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { MOCK_USERS } from '../mocks/users.mock';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly collection = signal<readonly User[]>(MOCK_USERS);

  private readonly session = signal<User>(MOCK_USERS[0]);

  readonly currentUser = this.session.asReadonly();

  getAll(): readonly User[] {
    return [...this.collection()];
  }

  getById(id: string): User | undefined {
    return this.collection().find((user) => user.id === id);
  }
}