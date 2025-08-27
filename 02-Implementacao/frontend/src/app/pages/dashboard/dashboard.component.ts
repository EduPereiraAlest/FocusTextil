import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from './dashboard.service';

export interface DashboardStats {
  totalUsers: number;
  totalMaterials: number;
  totalOrders: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-gray-600">
          Bem-vindo, {{ authService.user()?.name }}! Aqui está um resumo do seu sistema.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <mat-card class="stats-card">
          <mat-card-content class="p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100">
                <mat-icon class="text-blue-600">people</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Usuários</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ stats()?.totalUsers || 0 }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stats-card">
          <mat-card-content class="p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100">
                <mat-icon class="text-green-600">inventory_2</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Materiais</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ stats()?.totalMaterials || 0 }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stats-card">
          <mat-card-content class="p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-yellow-100">
                <mat-icon class="text-yellow-600">shopping_cart</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Pedidos</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ stats()?.totalOrders || 0 }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stats-card">
          <mat-card-content class="p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100">
                <mat-icon class="text-purple-600">attach_money</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Receita</p>
                <p class="text-2xl font-bold text-gray-900">
                  R$ {{ formatCurrency(stats()?.revenue || 0) }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <mat-card class="action-card">
          <mat-card-content class="p-6">
            <h3 class="text-lg font-medium mb-2">Gestão de Usuários</h3>
            <p class="text-gray-600 mb-4">Administre usuários e permissões</p>
            <button mat-raised-button color="primary" routerLink="/users">
              <mat-icon>people</mat-icon>
              Gerenciar Usuários
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="action-card">
          <mat-card-content class="p-6">
            <h3 class="text-lg font-medium mb-2">Controle de Estoque</h3>
            <p class="text-gray-600 mb-4">Gerencie materiais e inventário</p>
            <button mat-raised-button color="primary" routerLink="/materials">
              <mat-icon>inventory_2</mat-icon>
              Ver Materiais
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="action-card">
          <mat-card-content class="p-6">
            <h3 class="text-lg font-medium mb-2">Pedidos Recentes</h3>
            <p class="text-gray-600 mb-4">Visualize e processe pedidos</p>
            <button mat-raised-button color="primary" routerLink="/orders">
              <mat-icon>shopping_cart</mat-icon>
              Ver Pedidos
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      transition: transform 0.2s ease-in-out;
    }
    
    .stats-card:hover {
      transform: translateY(-2px);
    }
    
    .action-card {
      transition: transform 0.2s ease-in-out;
    }
    
    .action-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private async loadDashboardStats(): Promise<void> {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
