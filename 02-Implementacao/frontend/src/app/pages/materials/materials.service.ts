import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Material {
  id: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialRequest {
  code: string;
  name: string;
  description: string;
  quantity: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  category: string;
  supplier?: string;
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);

  async getMaterials(): Promise<Material[]> {
    return firstValueFrom(
      this.http.get<Material[]>('/api/materials')
    );
  }

  async getMaterial(id: string): Promise<Material> {
    return firstValueFrom(
      this.http.get<Material>(`/api/materials/${id}`)
    );
  }

  async createMaterial(material: CreateMaterialRequest): Promise<Material> {
    return firstValueFrom(
      this.http.post<Material>('/api/materials', material)
    );
  }

  async updateMaterial(id: string, material: Partial<CreateMaterialRequest>): Promise<Material> {
    return firstValueFrom(
      this.http.put<Material>(`/api/materials/${id}`, material)
    );
  }

  async deleteMaterial(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`/api/materials/${id}`)
    );
  }

  async searchMaterials(query: string): Promise<Material[]> {
    return firstValueFrom(
      this.http.get<Material[]>(`/api/materials/search?q=${encodeURIComponent(query)}`)
    );
  }
}
