import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Erro inesperado. Tente novamente.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente.';
            router.navigate(['/login']);
            break;
          case 403:
            errorMessage = 'Você não tem permissão para esta ação.';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado.';
            break;
          case 422:
            errorMessage = error.error?.message || 'Dados inválidos.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor.';
            break;
          default:
            errorMessage = error.error?.message || errorMessage;
        }
      }

      // Show error notification
      snackBar.open(errorMessage, 'Fechar', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      return throwError(() => error);
    })
  );
};
