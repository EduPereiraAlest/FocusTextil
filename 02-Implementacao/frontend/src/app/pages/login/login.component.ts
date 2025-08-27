import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <img class="mx-auto h-16 w-auto" src="/focus-logo.svg" alt="Focus Textil" />
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Faça login na sua conta
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Sistema de Gestão Focus Textil
          </p>
        </div>

        <!-- Login Form -->
        <mat-card class="mt-8">
          <mat-card-content class="p-6">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Email</mat-label>
                  <input 
                    matInput 
                    type="email" 
                    formControlName="email"
                    placeholder="seu@email.com"
                  />
                  <mat-icon matPrefix>email</mat-icon>
                  <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                    Email é obrigatório
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                    Email deve ter um formato válido
                  </mat-error>
                </mat-form-field>
              </div>

              <div>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Senha</mat-label>
                  <input 
                    matInput 
                    [type]="hidePassword() ? 'password' : 'text'" 
                    formControlName="password"
                    placeholder="Sua senha"
                  />
                  <mat-icon matPrefix>lock</mat-icon>
                  <button 
                    mat-icon-button 
                    matSuffix 
                    type="button"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="'Hide password'"
                  >
                    <mat-icon>{{hidePassword() ? 'visibility' : 'visibility_off'}}</mat-icon>
                  </button>
                  <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                    Senha é obrigatória
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                    Senha deve ter pelo menos 6 caracteres
                  </mat-error>
                </mat-form-field>
              </div>

              <div>
                <button 
                  mat-raised-button 
                  color="primary"
                  type="submit" 
                  class="w-full py-3"
                  [disabled]="!loginForm.valid || isLoading()"
                >
                  <span *ngIf="!isLoading()">Entrar</span>
                  <span *ngIf="isLoading()" class="flex items-center justify-center">
                    <mat-icon class="animate-spin mr-2">refresh</mat-icon>
                    Entrando...
                  </span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            © 2024 Focus Textil. Sistema modernizado com Angular 19.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mat-form-field {
      width: 100%;
    }
    
    .mat-raised-button {
      height: 48px;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hidePassword = signal(true);
  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      try {
        this.isLoading.set(true);
        
        const credentials = this.loginForm.value;
        await this.authService.login(credentials);
        
        this.snackBar.open('Login realizado com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        console.error('Login failed:', error);
        // Error handling is done by the error interceptor
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}
