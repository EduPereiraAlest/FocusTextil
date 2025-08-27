import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'user';
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  async getUsers(): Promise<User[]> {
    return firstValueFrom(
      this.http.get<User[]>('/api/users')
    );
  }

  async getUser(id: string): Promise<User> {
    return firstValueFrom(
      this.http.get<User>(`/api/users/${id}`)
    );
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    return firstValueFrom(
      this.http.post<User>('/api/users', user)
    );
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return firstValueFrom(
      this.http.put<User>(`/api/users/${id}`, user)
    );
  }

  async deleteUser(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`/api/users/${id}`)
    );
  }
}
