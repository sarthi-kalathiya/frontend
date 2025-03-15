import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-subject-modal',
  templateUrl: './view-subject-modal.component.html',
  styleUrls: ['./view-subject-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ViewSubjectModalComponent {
  @Input() subject: any;
  @Output() close = new EventEmitter<void>();
  
  closeModal(): void {
    this.close.emit();
  }
  
  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
} 