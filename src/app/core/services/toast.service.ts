import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: BehaviorSubject<Toast[]> = new BehaviorSubject<Toast[]>([]);
  private nextId = 1;

  constructor() {}

  // Get observable to subscribe to toast updates
  getToasts(): Observable<Toast[]> {
    return this.toasts.asObservable();
  }

  // Show success toast (green)
  showSuccess(message: string, duration: number = 3000): void {
    this.show('success', message, duration);
  }

  // Show error toast (red)
  showError(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  // Show info toast (blue)
  showInfo(message: string, duration: number = 3000): void {
    this.show('info', message, duration);
  }

  // Remove a specific toast
  removeToast(id: number): void {
    const currentToasts = this.toasts.getValue();
    this.toasts.next(currentToasts.filter((toast) => toast.id !== id));
  }

  // Clear all toasts
  clearToasts(): void {
    this.toasts.next([]);
  }

  // Internal method to show toast and handle auto-removal
  private show(
    type: 'success' | 'error' | 'info',
    message: string,
    duration: number
  ): void {
    const id = this.nextId++;
    const toast: Toast = { id, type, message };

    // Add toast to array
    const currentToasts = this.toasts.getValue();
    this.toasts.next([...currentToasts, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }
}
