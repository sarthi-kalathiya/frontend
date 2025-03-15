import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationModalOptions {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: 'success' | 'danger' | 'warning' | 'info'; // Different styles of confirmation
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationModalService {
  private confirmationSubject = new Subject<{ options: ConfirmationModalOptions, confirmed: boolean }>();
  private optionsSubject = new Subject<ConfirmationModalOptions | null>();

  constructor() { }

  /**
   * Show a confirmation modal with the provided options
   * @param options The configuration options for the confirmation dialog
   * @returns An Observable that emits true when confirmed, false when cancelled
   */
  confirm(options: ConfirmationModalOptions): Observable<boolean> {
    // Set default button text if not provided
    const modalOptions: ConfirmationModalOptions = {
      ...options,
      confirmButtonText: options.confirmButtonText || 'Confirm',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      type: options.type || 'warning'
    };

    // Show the modal with these options
    this.optionsSubject.next(modalOptions);

    // Return an observable that will emit once when the user makes a decision
    return new Observable<boolean>(observer => {
      const subscription = this.confirmationSubject.subscribe(result => {
        if (result.options === modalOptions) {
          observer.next(result.confirmed);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  /**
   * Get the current modal options
   */
  getModalOptions(): Observable<ConfirmationModalOptions | null> {
    return this.optionsSubject.asObservable();
  }

  /**
   * Respond to the confirmation dialog
   */
  respond(options: ConfirmationModalOptions, confirmed: boolean): void {
    this.confirmationSubject.next({ options, confirmed });
    this.optionsSubject.next(null); // Close the modal
  }
} 