import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MaterialsService, Material } from './materials.service';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Materiais</h1>
          <p class="mt-1 text-gray-600">Gerencie o inventário de materiais</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Novo Material
        </button>
      </div>

      <!-- Search -->
      <mat-card class="mb-6">
        <mat-card-content class="p-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Buscar materiais</mat-label>
            <input matInput 
                   placeholder="Nome, código ou descrição..." 
                   [value]="searchTerm()"
                   (input)="onSearchChange($event)">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Materials Table -->
      <mat-card>
        <mat-card-content class="p-0">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredMaterials()" class="w-full">
              <!-- Code Column -->
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Código</th>
                <td mat-cell *matCellDef="let material">{{ material.code }}</td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Nome</th>
                <td mat-cell *matCellDef="let material">{{ material.name }}</td>
              </ng-container>

              <!-- Description Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Descrição</th>
                <td mat-cell *matCellDef="let material">{{ material.description }}</td>
              </ng-container>

              <!-- Quantity Column -->
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Quantidade</th>
                <td mat-cell *matCellDef="let material">
                  <span [class]="getQuantityClass(material.quantity, material.minStock)">
                    {{ material.quantity }} {{ material.unit }}
                  </span>
                </td>
              </ng-container>

              <!-- Unit Price Column -->
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Preço Unit.</th>
                <td mat-cell *matCellDef="let material">
                  R$ {{ formatCurrency(material.unitPrice) }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                <td mat-cell *matCellDef="let material">
                  <span [class]="getStatusClass(material.status)">
                    {{ getStatusLabel(material.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Ações</th>
                <td mat-cell *matCellDef="let material">
                  <button mat-icon-button (click)="editMaterial(material)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteMaterial(material.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Empty State -->
            <div *ngIf="filteredMaterials().length === 0" class="p-8 text-center">
              <mat-icon class="text-6xl text-gray-400 mb-4">inventory_2</mat-icon>
              <h3 class="text-xl font-medium text-gray-900 mb-2">
                {{ searchTerm() ? 'Nenhum material encontrado' : 'Nenhum material cadastrado' }}
              </h3>
              <p class="text-gray-600">
                {{ searchTerm() ? 'Tente ajustar sua busca.' : 'Comece adicionando um novo material.' }}
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
    
    .quantity-low {
      @apply text-red-600 font-medium;
    }
    
    .quantity-normal {
      @apply text-green-600;
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
export class MaterialsComponent implements OnInit {
  private materialsService = inject(MaterialsService);

  materials = signal<Material[]>([]);
  searchTerm = signal('');
  filteredMaterials = signal<Material[]>([]);

  displayedColumns: string[] = ['code', 'name', 'description', 'quantity', 'unitPrice', 'status', 'actions'];

  ngOnInit(): void {
    this.loadMaterials();
  }

  private async loadMaterials(): Promise<void> {
    try {
      const materials = await this.materialsService.getMaterials();
      this.materials.set(materials);
      this.filteredMaterials.set(materials);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase();
    this.searchTerm.set(searchValue);
    
    const filtered = this.materials().filter(material => 
      material.name.toLowerCase().includes(searchValue) ||
      material.code.toLowerCase().includes(searchValue) ||
      material.description.toLowerCase().includes(searchValue)
    );
    
    this.filteredMaterials.set(filtered);
  }

  openCreateDialog(): void {
    // TODO: Implement create material dialog
    console.log('Open create material dialog');
  }

  editMaterial(material: Material): void {
    // TODO: Implement edit material dialog
    console.log('Edit material:', material);
  }

  async deleteMaterial(id: string): Promise<void> {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      try {
        await this.materialsService.deleteMaterial(id);
        await this.loadMaterials();
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  }

  getQuantityClass(quantity: number, minStock: number): string {
    return quantity <= minStock ? 'quantity-low' : 'quantity-normal';
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
