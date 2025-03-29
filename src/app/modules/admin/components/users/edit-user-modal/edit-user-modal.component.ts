import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../../../core/services/user.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditUserModalComponent implements OnInit {
  @Input() userId!: string;
  @Output() close = new EventEmitter<boolean>();
  
  userForm: FormGroup;
  isLoading = true;
  isSubmitting = false;
  error = '';
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastService: ToastService
  ) {
    // Initialize form with empty values
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', [
        Validators.required, 
        Validators.pattern(/^\d{9,11}$/)
      ]]
    });
  }
  
  ngOnInit(): void {
    this.loadUserDetails();
  }
  
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = '';
    
    this.userService.getUserById(this.userId).subscribe({
      next: (response) => {
        const userData = response.data;
        
        // Patch form with user data
        this.userForm.patchValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          contactNumber: userData.contactNumber || ''
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Failed to load user details';
        this.toastService.showError(this.error);
      }
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
    
    const userData = this.userForm.value;
    
    this.userService.updateUser(this.userId, userData).subscribe({
      next: (response) => {
        this.toastService.showSuccess('User updated successfully!');
        this.closeModal(true); // Close with refresh flag
      },
      error: (error) => {
        this.isSubmitting = false;
        this.toastService.showError(error.error?.message || 'Failed to update user. Please try again.');
      }
    });
  }
  
  closeModal(refresh = false): void {
    this.close.emit(refresh);
  }
} 