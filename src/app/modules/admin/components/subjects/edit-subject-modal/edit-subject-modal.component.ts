import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../../../../core/services/subject.service';
import { ToastService } from '../../../../../core/services/toast.service';

interface SubjectForm {
  name: string;
  code: string;
  credits: number;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-edit-subject-modal',
  templateUrl: './edit-subject-modal.component.html',
  styleUrls: ['./edit-subject-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EditSubjectModalComponent implements OnInit {
  @Input() subject: any;
  @Output() close = new EventEmitter<boolean>();
  
  editForm: SubjectForm = {
    name: '',
    code: '',
    credits: 3,
    description: '',
    isActive: true
  };
  
  errors: Record<string, string> = {};
  isSubmitting: boolean = false;
  
  constructor(
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.subject) {
      // Clone the subject to avoid modifying the original
      this.editForm = {
        name: this.subject.name,
        code: this.subject.code || '',
        credits: this.subject.credits || 3,
        description: this.subject.description || '',
        isActive: this.subject.isActive
      };
    }
  }

  closeModal(refresh: boolean = false): void {
    this.close.emit(refresh);
  }

  validateForm(): boolean {
    this.errors = {};
    
    // Validate name
    if (!this.editForm.name.trim()) {
      this.errors['name'] = 'Subject name is required';
    } else if (this.editForm.name.length > 100) {
      this.errors['name'] = 'Subject name must be less than 100 characters';
    }
    
    // Validate code
    if (!this.editForm.code.trim()) {
      this.errors['code'] = 'Subject code is required';
    } else if (!/^[A-Z]{2,5}-\d{3}$/.test(this.editForm.code)) {
      this.errors['code'] = 'Subject code must be in format: DEPT-123';
    }
    
    // Validate credits
    if (!this.editForm.credits) {
      this.errors['credits'] = 'Credits are required';
    } else if (this.editForm.credits < 1 || this.editForm.credits > 6) {
      this.errors['credits'] = 'Credits must be between 1 and 6';
    }
    
    // Validate description
    if (this.editForm.description && this.editForm.description.length > 500) {
      this.errors['description'] = 'Description must be less than 500 characters';
    }
    
    return Object.keys(this.errors).length === 0;
  }

  handleSubmit(): void {
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting = true;
    
    this.subjectService.updateSubject(this.subject.id, this.editForm).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Subject updated successfully');
        this.closeModal(true); // Close with refresh flag
      },
      error: (error) => {
        this.isSubmitting = false;
        
        if (error.error?.errors) {
          // Map server validation errors to form fields
          for (const field in error.error.errors) {
            this.errors[field] = error.error.errors[field];
          }
        } else {
          // General error
          this.toastService.showError(error.error?.message || 'Failed to update subject');
        }
        
        console.error('Error updating subject:', error);
      }
    });
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
} 