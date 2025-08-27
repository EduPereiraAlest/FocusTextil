import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private _user = signal<User | null>(null);
  private _accessToken = signal<string | null>(null);
  private _isLoading = signal(false);

  // Public computed signals
  user = computed(() => this._user());
  isLoading = computed(() => this._isLoading());
  isAuthenticated = computed(() => !!this._user() && !!this._accessToken());

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this._accessToken.set(token);
        this._user.set(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      this._isLoading.set(true);
      
      const response = await firstValueFrom(
        this.http.post<AuthResponse>('/api/auth/login', credentials)
      );

      // Store tokens and user data
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Update signals
      this._accessToken.set(response.accessToken);
      this._user.set(response.user);

      return response;
    } catch (error) {
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    this._accessToken.set(null);
    this._user.set(null);
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return null;

      const response = await firstValueFrom(
        this.http.post<{ accessToken: string }>('/api/auth/refresh', {
          refreshToken
        })
      );

      localStorage.setItem('access_token', response.accessToken);
      this._accessToken.set(response.accessToken);
      
      return response.accessToken;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }
}
