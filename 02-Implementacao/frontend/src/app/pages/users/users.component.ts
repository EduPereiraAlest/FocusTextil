import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';

import { UsersService, User } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Usuários</h1>
          <p class="mt-1 text-gray-600">Gerencie usuários e permissões do sistema</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon>
          Novo Usuário
        </button>
      </div>

      <!-- Search -->
      <mat-card class="mb-6">
        <mat-card-content class="p-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Buscar usuários</mat-label>
            <input matInput 
                   placeholder="Nome, email ou função..." 
                   [value]="searchTerm()"
                   (input)="onSearchChange($event)">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Users Table -->
      <mat-card>
        <mat-card-content class="p-0">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredUsers()" class="w-full">
              <!-- Avatar Column -->
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef class="font-semibold w-16"></th>
                <td mat-cell *matCellDef="let user">
                  <div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                    <span class="text-blue-600 font-medium">
                      {{ getInitials(user.name) }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Nome</th>
                <td mat-cell *matCellDef="let user">
                  <div>
                    <div class="font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Função</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [class]="getRoleClass(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                <td mat-cell *matCellDef="let user">
                  <span [class]="getStatusClass(user.status)">
                    {{ getStatusLabel(user.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Last Login Column -->
              <ng-container matColumnDef="lastLogin">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Último Login</th>
                <td mat-cell *matCellDef="let user">
                  <span class="text-sm text-gray-600">
                    {{ user.lastLogin ? formatDate(user.lastLogin) : 'Nunca' }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Ações</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          [color]="user.status === 'active' ? 'warn' : 'primary'"
                          (click)="toggleUserStatus(user)">
                    <mat-icon>{{ user.status === 'active' ? 'block' : 'check_circle' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteUser(user.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Empty State -->
            <div *ngIf="filteredUsers().length === 0" class="p-8 text-center">
              <mat-icon class="text-6xl text-gray-400 mb-4">people</mat-icon>
              <h3 class="text-xl font-medium text-gray-900 mb-2">
                {{ searchTerm() ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado' }}
              </h3>
              <p class="text-gray-600">
                {{ searchTerm() ? 'Tente ajustar sua busca.' : 'Comece adicionando um novo usuário.' }}
              </p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mat-table {
      width: 100%;
    }
    
    .role-admin {
      @apply bg-purple-100 text-purple-800;
    }
    
    .role-manager {
      @apply bg-blue-100 text-blue-800;
    }
    
    .role-user {
      @apply bg-green-100 text-green-800;
    }
    
    .status-active {
      @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800;
    }
    
    .status-inactive {
      @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800;
    }
    
    .status-pending {
      @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800;
    }
  `]
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users = signal<User[]>([]);
  searchTerm = signal('');
  filteredUsers = signal<User[]>([]);

  displayedColumns: string[] = ['avatar', 'name', 'role', 'status', 'lastLogin', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      const users = await this.usersService.getUsers();
      this.users.set(users);
      this.filteredUsers.set(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase();
    this.searchTerm.set(searchValue);
    
    const filtered = this.users().filter(user => 
      user.name.toLowerCase().includes(searchValue) ||
      user.email.toLowerCase().includes(searchValue) ||
      user.role.toLowerCase().includes(searchValue)
    );
    
    this.filteredUsers.set(filtered);
  }

  openCreateDialog(): void {
    console.log('Open create user dialog');
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  async toggleUserStatus(user: User): Promise<void> {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await this.usersService.updateUser(user.id, { status: newStatus });
      await this.loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await this.usersService.deleteUser(id);
        await this.loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getRoleClass(role: string): string {
    return `role-${role}`;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário'
    };
    return labels[role] || role;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'pending': 'Pendente'
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
