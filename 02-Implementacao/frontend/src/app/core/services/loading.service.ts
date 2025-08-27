import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _isLoading = signal(false);
  private _loadingCount = signal(0);

  isLoading = this._isLoading.asReadonly();

  show(): void {
    this._loadingCount.update(count => count + 1);
    this._isLoading.set(true);
  }

  hide(): void {
    this._loadingCount.update(count => Math.max(0, count - 1));
    
    if (this._loadingCount() === 0) {
      this._isLoading.set(false);
    }
  }

  forceHide(): void {
    this._loadingCount.set(0);
    this._isLoading.set(false);
  }
}
