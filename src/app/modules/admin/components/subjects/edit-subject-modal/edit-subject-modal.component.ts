import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubjectService } from '../../../../../core/services/subject.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-subject-modal',
  templateUrl: './edit-subject-modal.component.html',
  styleUrls: ['./edit-subject-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditSubjectModalComponent implements OnInit {
  @Input() subject: any;
  @Output() close = new EventEmitter<boolean>();
  
  subjectForm!: FormGroup;
  isSubmitting = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.subject) {
      this.patchFormValues();
    }
  }
  
  private initForm(): void {
    this.subjectForm = this.formBuilder.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(100)
      ]],
      code: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(20),
        Validators.pattern(/^[A-Z]{3}-\d{3}$/)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]],
      credits: [3, [
        Validators.required,
        Validators.min(1), 
        Validators.max(10)
      ]],
      isActive: [true]
    });
  }
  
  private patchFormValues(): void {
    this.subjectForm.patchValue({
      name: this.subject.name || '',
      code: this.subject.code || '',
      credits: this.subject.credits || 3,
      description: this.subject.description || '',
      isActive: this.subject.isActive !== undefined ? this.subject.isActive : true
    });
  }

  // Getter methods for easier access in the template
  get name() { return this.subjectForm.get('name'); }
  get code() { return this.subjectForm.get('code'); }
  get description() { return this.subjectForm.get('description'); }
  get credits() { return this.subjectForm.get('credits'); }

  closeModal(refresh: boolean = false): void {
    this.close.emit(refresh);
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      // Mark all fields as touched to trigger validation errors
      Object.keys(this.subjectForm.controls).forEach(key => {
        this.subjectForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isSubmitting = true;
    
    this.subjectService.updateSubject(this.subject.id, this.subjectForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Subject updated successfully');
        this.closeModal(true); // Close with refresh flag
      },
      error: (error) => {
        this.isSubmitting = false;
        this.toastService.showError(error.error?.message || 'Failed to update subject');
        console.error('Error updating subject:', error);
      }
    });
  }
} 