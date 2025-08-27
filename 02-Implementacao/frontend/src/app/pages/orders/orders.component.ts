import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';

import { OrdersService, Order } from './orders.service';

@Component({
  selector: 'app-orders',
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
          <h1 class="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p class="mt-1 text-gray-600">Gerencie pedidos e vendas</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add_shopping_cart</mat-icon>
          Novo Pedido
        </button>
      </div>

      <!-- Search -->
      <mat-card class="mb-6">
        <mat-card-content class="p-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Buscar pedidos</mat-label>
            <input matInput 
                   placeholder="Número, cliente ou produto..." 
                   [value]="searchTerm()"
                   (input)="onSearchChange($event)">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Orders Table -->
      <mat-card>
        <mat-card-content class="p-0">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredOrders()" class="w-full">
              <!-- Order Number Column -->
              <ng-container matColumnDef="orderNumber">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Nº Pedido</th>
                <td mat-cell *matCellDef="let order">
                  <span class="font-mono text-sm">{{ order.orderNumber }}</span>
                </td>
              </ng-container>

              <!-- Customer Column -->
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Cliente</th>
                <td mat-cell *matCellDef="let order">
                  <div>
                    <div class="font-medium text-gray-900">{{ order.customerName }}</div>
                    <div class="text-sm text-gray-500">{{ order.customerEmail }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Items Column -->
              <ng-container matColumnDef="items">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Items</th>
                <td mat-cell *matCellDef="let order">
                  <span class="text-sm">{{ order.totalItems }} item(s)</span>
                </td>
              </ng-container>

              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Total</th>
                <td mat-cell *matCellDef="let order">
                  <span class="font-semibold">R$ {{ formatCurrency(order.totalAmount) }}</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                <td mat-cell *matCellDef="let order">
                  <mat-chip [class]="getStatusClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="orderDate">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Data</th>
                <td mat-cell *matCellDef="let order">
                  <span class="text-sm text-gray-600">
                    {{ formatDate(order.orderDate) }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Ações</th>
                <td mat-cell *matCellDef="let order">
                  <button mat-icon-button (click)="viewOrder(order)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button (click)="editOrder(order)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="updateOrderStatus(order)">
                    <mat-icon>update</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Empty State -->
            <div *ngIf="filteredOrders().length === 0" class="p-8 text-center">
              <mat-icon class="text-6xl text-gray-400 mb-4">shopping_cart</mat-icon>
              <h3 class="text-xl font-medium text-gray-900 mb-2">
                {{ searchTerm() ? 'Nenhum pedido encontrado' : 'Nenhum pedido registrado' }}
              </h3>
              <p class="text-gray-600">
                {{ searchTerm() ? 'Tente ajustar sua busca.' : 'Comece criando um novo pedido.' }}
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
    
    .status-pending {
      @apply bg-yellow-100 text-yellow-800;
    }
    
    .status-processing {
      @apply bg-blue-100 text-blue-800;
    }
    
    .status-shipped {
      @apply bg-purple-100 text-purple-800;
    }
    
    .status-delivered {
      @apply bg-green-100 text-green-800;
    }
    
    .status-cancelled {
      @apply bg-red-100 text-red-800;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);

  orders = signal<Order[]>([]);
  searchTerm = signal('');
  filteredOrders = signal<Order[]>([]);

  displayedColumns: string[] = ['orderNumber', 'customer', 'items', 'total', 'status', 'orderDate', 'actions'];

  ngOnInit(): void {
    this.loadOrders();
  }

  private async loadOrders(): Promise<void> {
    try {
      const orders = await this.ordersService.getOrders();
      this.orders.set(orders);
      this.filteredOrders.set(orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase();
    this.searchTerm.set(searchValue);
    
    const filtered = this.orders().filter(order => 
      order.orderNumber.toLowerCase().includes(searchValue) ||
      order.customerName.toLowerCase().includes(searchValue) ||
      order.customerEmail.toLowerCase().includes(searchValue)
    );
    
    this.filteredOrders.set(filtered);
  }

  openCreateDialog(): void {
    console.log('Open create order dialog');
  }

  viewOrder(order: Order): void {
    console.log('View order:', order);
  }

  editOrder(order: Order): void {
    console.log('Edit order:', order);
  }

  updateOrderStatus(order: Order): void {
    console.log('Update order status:', order);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
