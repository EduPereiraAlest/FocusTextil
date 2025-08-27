import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface OrderItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Omit<OrderItem, 'id' | 'totalPrice'>[];
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);

  async getOrders(): Promise<Order[]> {
    return firstValueFrom(
      this.http.get<Order[]>('/api/orders')
    );
  }

  async getOrder(id: string): Promise<Order> {
    return firstValueFrom(
      this.http.get<Order>(`/api/orders/${id}`)
    );
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    return firstValueFrom(
      this.http.post<Order>('/api/orders', order)
    );
  }

  async updateOrder(id: string, order: Partial<CreateOrderRequest>): Promise<Order> {
    return firstValueFrom(
      this.http.put<Order>(`/api/orders/${id}`, order)
    );
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    return firstValueFrom(
      this.http.patch<Order>(`/api/orders/${id}/status`, { status })
    );
  }

  async deleteOrder(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`/api/orders/${id}`)
    );
  }
}
