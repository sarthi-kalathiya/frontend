import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  selector: 'app-add-subject-modal',
  templateUrl: './add-subject-modal.component.html',
  styleUrls: ['./add-subject-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AddSubjectModalComponent implements OnInit {
  @Output() close = new EventEmitter<boolean>();
  
  subject: SubjectForm = {
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
    // Initialize form or load any required data
  }

  closeModal(refresh: boolean = false): void {
    this.close.emit(refresh);
  }

  validateForm(): boolean {
    this.errors = {};
    
    // Validate name
    if (!this.subject.name.trim()) {
      this.errors['name'] = 'Subject name is required';
    } else if (this.subject.name.length > 100) {
      this.errors['name'] = 'Subject name must be less than 100 characters';
    }
    
    // Validate code
    if (!this.subject.code.trim()) {
      this.errors['code'] = 'Subject code is required';
    } else if (!/^[A-Z]{2,5}-\d{3}$/.test(this.subject.code)) {
      this.errors['code'] = 'Subject code must be in format: DEPT-123';
    }
    
    // Validate credits
    if (!this.subject.credits) {
      this.errors['credits'] = 'Credits are required';
    } else if (this.subject.credits < 1 || this.subject.credits > 6) {
      this.errors['credits'] = 'Credits must be between 1 and 6';
    }
    
    // Validate description
    if (this.subject.description && this.subject.description.length > 500) {
      this.errors['description'] = 'Description must be less than 500 characters';
    }
    
    return Object.keys(this.errors).length === 0;
  }

  handleSubmit(): void {
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting = true;
    
    this.subjectService.createSubject(this.subject).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Subject created successfully');
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
          this.toastService.showError(error.error?.message || 'Failed to create subject');
        }
        
        console.error('Error creating subject:', error);
      }
    });
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
} 