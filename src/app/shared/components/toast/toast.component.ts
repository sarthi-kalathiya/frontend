import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast" 
        [ngClass]="'toast-' + toast.type"
        (click)="removeToast(toast.id)"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <i *ngIf="toast.type === 'success'" class="fas fa-check-circle"></i>
            <i *ngIf="toast.type === 'error'" class="fas fa-exclamation-circle"></i>
            <i *ngIf="toast.type === 'info'" class="fas fa-info-circle"></i>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="removeToast(toast.id); $event.stopPropagation()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }
    
    .toast {
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: toast-in 0.3s ease-in-out;
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    }
    
    .toast:hover {
      transform: translateY(-2px);
    }
    
    .toast-content {
      display: flex;
      align-items: center;
    }
    
    .toast-icon {
      margin-right: 12px;
      font-size: 20px;
    }
    
    .toast-message {
      flex: 1;
      font-size: 14px;
    }
    
    .toast-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      padding: 0;
      margin-left: 12px;
      font-size: 14px;
    }
    
    .toast-close:hover {
      opacity: 1;
    }
    
    .toast-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }
    
    .toast-error {
      background-color: #fdecea;
      color: #d32f2f;
      border-left: 4px solid #f44336;
    }
    
    .toast-info {
      background-color: #e3f2fd;
      color: #1565c0;
      border-left: 4px solid #2196f3;
    }
    
    @keyframes toast-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(id: number): void {
    this.toastService.removeToast(id);
  }
} 