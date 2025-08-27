import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    // Router configuration
    provideRouter(routes),
    
    // HTTP Client with interceptors
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    
    // Angular Material and animations
    importProvidersFrom(
      BrowserAnimationsModule,
      MatSnackBarModule
    ),
    
    // Environment configuration
    {
      provide: 'API_BASE_URL',
      useValue: 'https://api.focustextil.com'
    }
  ]
}).catch(err => console.error('Error starting Focus Textil app:', err));
