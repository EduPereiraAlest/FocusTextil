import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  
  // Authentication routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  
  // Protected routes
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'materials',
    loadComponent: () => import('./pages/materials/materials.component').then(m => m.MaterialsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  
  // 404 fallback
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
