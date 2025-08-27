import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserPreferences {
  language: string;
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
}

export interface ProfileUpdateRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);

  async getPreferences(): Promise<UserPreferences> {
    return firstValueFrom(
      this.http.get<UserPreferences>('/api/user/preferences')
    );
  }

  async updatePreferences(preferences: UserPreferences): Promise<void> {
    return firstValueFrom(
      this.http.put<void>('/api/user/preferences', preferences)
    );
  }

  async updateProfile(profile: ProfileUpdateRequest): Promise<void> {
    return firstValueFrom(
      this.http.put<void>('/api/user/profile', profile)
    );
  }

  async updatePassword(passwordData: PasswordUpdateRequest): Promise<void> {
    return firstValueFrom(
      this.http.put<void>('/api/user/password', passwordData)
    );
  }

  async exportUserData(): Promise<Blob> {
    return firstValueFrom(
      this.http.get('/api/user/export', { responseType: 'blob' })
    );
  }
}
