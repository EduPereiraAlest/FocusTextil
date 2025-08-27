import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Configurações</h1>
        <p class="mt-1 text-gray-600">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <!-- Settings Tabs -->
      <mat-tab-group class="settings-tabs">
        <!-- Profile Tab -->
        <mat-tab label="Perfil">
          <mat-card class="mt-4">
            <mat-card-header>
              <mat-card-title>Informações do Perfil</mat-card-title>
              <mat-card-subtitle>Atualize suas informações pessoais</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="p-6">
              <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="space-y-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Nome Completo</mat-label>
                  <input matInput formControlName="name" placeholder="Seu nome completo">
                  <mat-icon matPrefix>person</mat-icon>
                </mat-form-field>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="seu@email.com">
                  <mat-icon matPrefix>email</mat-icon>
                </mat-form-field>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Telefone</mat-label>
                  <input matInput formControlName="phone" placeholder="(11) 99999-9999">
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>

                <div class="flex justify-end">
                  <button mat-raised-button color="primary" type="submit" [disabled]="!profileForm.valid">
                    <mat-icon>save</mat-icon>
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Security Tab -->
        <mat-tab label="Segurança">
          <mat-card class="mt-4">
            <mat-card-header>
              <mat-card-title>Alterar Senha</mat-card-title>
              <mat-card-subtitle>Mantenha sua conta segura</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="p-6">
              <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="space-y-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Senha Atual</mat-label>
                  <input matInput [type]="hideCurrentPassword() ? 'password' : 'text'" 
                         formControlName="currentPassword">
                  <mat-icon matPrefix>lock</mat-icon>
                  <button mat-icon-button matSuffix type="button" 
                          (click)="toggleCurrentPasswordVisibility()">
                    <mat-icon>{{hideCurrentPassword() ? 'visibility' : 'visibility_off'}}</mat-icon>
                  </button>
                </mat-form-field>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Nova Senha</mat-label>
                  <input matInput [type]="hideNewPassword() ? 'password' : 'text'" 
                         formControlName="newPassword">
                  <mat-icon matPrefix>lock_outline</mat-icon>
                  <button mat-icon-button matSuffix type="button" 
                          (click)="toggleNewPasswordVisibility()">
                    <mat-icon>{{hideNewPassword() ? 'visibility' : 'visibility_off'}}</mat-icon>
                  </button>
                </mat-form-field>

                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Confirmar Nova Senha</mat-label>
                  <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" 
                         formControlName="confirmPassword">
                  <mat-icon matPrefix>lock_outline</mat-icon>
                  <button mat-icon-button matSuffix type="button" 
                          (click)="toggleConfirmPasswordVisibility()">
                    <mat-icon>{{hideConfirmPassword() ? 'visibility' : 'visibility_off'}}</mat-icon>
                  </button>
                </mat-form-field>

                <div class="flex justify-end">
                  <button mat-raised-button color="primary" type="submit" 
                          [disabled]="!passwordForm.valid">
                    <mat-icon>security</mat-icon>
                    Alterar Senha
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Preferences Tab -->
        <mat-tab label="Preferências">
          <mat-card class="mt-4">
            <mat-card-header>
              <mat-card-title>Preferências do Sistema</mat-card-title>
              <mat-card-subtitle>Personalize sua experiência</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="p-6">
              <form [formGroup]="preferencesForm" (ngSubmit)="updatePreferences()" class="space-y-6">
                <!-- Language -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">Idioma</h3>
                    <p class="text-sm text-gray-500">Selecione o idioma da interface</p>
                  </div>
                  <mat-form-field appearance="outline">
                    <mat-select formControlName="language">
                      <mat-option value="pt-BR">Português (Brasil)</mat-option>
                      <mat-option value="en-US">English (US)</mat-option>
                      <mat-option value="es-ES">Español</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <!-- Theme -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">Tema Escuro</h3>
                    <p class="text-sm text-gray-500">Ativar modo escuro</p>
                  </div>
                  <mat-slide-toggle formControlName="darkMode"></mat-slide-toggle>
                </div>

                <!-- Notifications -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">Notificações</h3>
                    <p class="text-sm text-gray-500">Receber notificações do sistema</p>
                  </div>
                  <mat-slide-toggle formControlName="notifications"></mat-slide-toggle>
                </div>

                <!-- Email Notifications -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">Notificações por Email</h3>
                    <p class="text-sm text-gray-500">Receber notificações por email</p>
                  </div>
                  <mat-slide-toggle formControlName="emailNotifications"></mat-slide-toggle>
                </div>

                <div class="flex justify-end">
                  <button mat-raised-button color="primary" type="submit">
                    <mat-icon>save</mat-icon>
                    Salvar Preferências
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- System Info Tab -->
        <mat-tab label="Sistema">
          <mat-card class="mt-4">
            <mat-card-header>
              <mat-card-title>Informações do Sistema</mat-card-title>
              <mat-card-subtitle>Detalhes sobre a versão e configuração</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="p-6">
              <div class="space-y-4">
                <div class="flex justify-between items-center py-2 border-b">
                  <span class="font-medium">Versão do Sistema:</span>
                  <span class="text-gray-600">Focus Textil v2.0.0</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b">
                  <span class="font-medium">Framework:</span>
                  <span class="text-gray-600">Angular 19</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b">
                  <span class="font-medium">Último Backup:</span>
                  <span class="text-gray-600">Hoje às 03:00</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b">
                  <span class="font-medium">Status do Sistema:</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operacional
                  </span>
                </div>
              </div>

              <div class="mt-6">
                <button mat-raised-button color="primary" (click)="exportData()">
                  <mat-icon>download</mat-icon>
                  Exportar Dados
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-tabs {
      min-height: 400px;
    }
    
    .mat-form-field {
      width: 100%;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);

  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  preferencesForm: FormGroup = this.fb.group({
    language: ['pt-BR'],
    darkMode: [false],
    notifications: [true],
    emailNotifications: [true]
  });

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPreferences();
  }

  private loadUserProfile(): void {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email
      });
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const preferences = await this.settingsService.getPreferences();
      this.preferencesForm.patchValue(preferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  toggleCurrentPasswordVisibility(): void {
    this.hideCurrentPassword.update(value => !value);
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword.update(value => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(value => !value);
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.valid) {
      try {
        await this.settingsService.updateProfile(this.profileForm.value);
        this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value;
      
      if (newPassword !== confirmPassword) {
        this.snackBar.open('As senhas não coincidem', 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      try {
        await this.settingsService.updatePassword(this.passwordForm.value);
        this.snackBar.open('Senha alterada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.passwordForm.reset();
      } catch (error) {
        console.error('Failed to update password:', error);
      }
    }
  }

  async updatePreferences(): Promise<void> {
    try {
      await this.settingsService.updatePreferences(this.preferencesForm.value);
      this.snackBar.open('Preferências salvas com sucesso!', 'Fechar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  async exportData(): Promise<void> {
    try {
      await this.settingsService.exportUserData();
      this.snackBar.open('Dados exportados com sucesso!', 'Fechar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }
}
