import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardStats } from './dashboard.component';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  async getDashboardStats(): Promise<DashboardStats> {
    return firstValueFrom(
      this.http.get<DashboardStats>('/api/dashboard/stats')
    );
  }
}
