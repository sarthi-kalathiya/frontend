import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../../../core/services/user.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddUserModalComponent {
  @Output() close = new EventEmitter<boolean>();
  
  userForm: FormGroup;
  isSubmitting = false;
  
  // Available roles
  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'STUDENT', label: 'Student' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastService: ToastService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['STUDENT', [Validators.required]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{10,}$/)]]
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      // Mark all fields as touched to trigger validation errors
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    this.userService.createUser(this.userForm.value).subscribe({
      next: (response) => {
        // Show success toast notification
        this.toastService.showSuccess('User created successfully!');
        
        // Close the modal immediately with refresh flag
        this.closeModal(true);
      },
      error: (error) => {
        this.isSubmitting = false;
        
        // Show error toast notification
        this.toastService.showError(error.error?.message || 'Failed to create user. Please try again.');
      }
    });
  }

  closeModal(refresh = false): void {
    this.close.emit(refresh);
  }
} 