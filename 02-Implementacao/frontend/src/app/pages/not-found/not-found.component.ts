import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <div class="mx-auto">
          <!-- 404 Icon -->
          <div class="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
            <mat-icon class="h-16 w-16 text-red-600" style="font-size: 64px; width: 64px; height: 64px;">
              error_outline
            </mat-icon>
          </div>

          <!-- Error Message -->
          <h1 class="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Página não encontrada</h2>
          <p class="text-gray-600 mb-8">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>

          <!-- Actions -->
          <div class="space-y-4">
            <button 
              mat-raised-button 
              color="primary" 
              routerLink="/dashboard"
              class="w-full sm:w-auto"
            >
              <mat-icon>home</mat-icon>
              Voltar ao Dashboard
            </button>
            
            <div class="text-center">
              <button 
                mat-button 
                (click)="goBack()" 
                class="text-gray-600 hover:text-gray-900"
              >
                <mat-icon>arrow_back</mat-icon>
                Voltar à página anterior
              </button>
            </div>
          </div>

          <!-- Help Links -->
          <div class="mt-12 pt-8 border-t border-gray-200">
            <p class="text-sm text-gray-500 mb-4">Precisa de ajuda?</p>
            <div class="flex justify-center space-x-6">
              <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
                Suporte
              </a>
              <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
                Documentação
              </a>
              <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
                Contato
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
