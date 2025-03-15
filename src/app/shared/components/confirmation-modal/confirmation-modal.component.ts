import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmationModalService, ConfirmationModalOptions } from '../../../core/services/confirmation-modal.service';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  options: ConfirmationModalOptions | null = null;
  private subscription: Subscription | null = null;
  visible = false;
  closing = false;

  constructor(private confirmationModalService: ConfirmationModalService) { }

  ngOnInit(): void {
    this.subscription = this.confirmationModalService.getModalOptions().subscribe(options => {
      if (options) {
        this.options = options;
        this.visible = true;
        this.closing = false;
      } else {
        // Handle modal closing with animation
        if (this.visible) {
          this.closing = true;
          setTimeout(() => {
            this.visible = false;
            this.closing = false;
            this.options = null;
          }, 300); // Match this with CSS transition duration
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onConfirm(): void {
    if (this.options) {
      this.confirmationModalService.respond(this.options, true);
    }
  }

  onCancel(): void {
    if (this.options) {
      this.confirmationModalService.respond(this.options, false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    // Only close if the click was directly on the backdrop, not on the modal
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }

  getIconClass(): string {
    switch (this.options?.type) {
      case 'success':
        return 'fa-check-circle';
      case 'danger':
        return 'fa-exclamation-circle';
      case 'info':
        return 'fa-info-circle';
      case 'warning':
      default:
        return 'fa-exclamation-triangle';
    }
  }

  getColorClass(): string {
    return `modal-${this.options?.type || 'warning'}`;
  }
} 