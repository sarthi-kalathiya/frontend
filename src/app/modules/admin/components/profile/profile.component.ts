import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { UserData } from '../../../../core/models/auth.models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  currentUser: UserData | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  showPasswordForm = false;
  formSubmitted = false;
  passwordFormSubmitted = false;
  apiError: string | null = null;
  passwordApiError: string | null = null;

  // Services
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private toastService = inject(ToastService);

  constructor() {
    // Initialize forms
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      contactNumber: ['', [Validators.required]]
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.apiError = null;
    
    // First try to load from server
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data) {
          this.currentUser = response.data;
          // Update form with server data
          this.updateFormWithUserData();
        }
      },
      error: (error) => {
        console.error('Error loading profile from server:', error);
        this.isLoading = false;
        this.apiError = error.error?.message || 'Failed to load profile data from server';
        
        // Fallback to locally stored user data
        this.loadFromLocalData();
      }
    });
  }

  // Fallback method to load from local auth state if server request fails
  loadFromLocalData(): void {
    this.authService.user$.subscribe((user: UserData | null) => {
      this.currentUser = user;
      if (user) {
        this.updateFormWithUserData();
      }
    });
  }

  // Helper method to update the form with current user data
  private updateFormWithUserData(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        contactNumber: this.currentUser.contactNumber || ''
      });
    }
  }

  updateProfile(): void {
    this.formSubmitted = true;
    this.apiError = null;
    
    // Only validate active controls (firstName, lastName, contactNumber)
    const firstNameControl = this.profileForm.get('firstName');
    const lastNameControl = this.profileForm.get('lastName');
    const contactNumberControl = this.profileForm.get('contactNumber');
    
    if ((firstNameControl && firstNameControl.invalid) || 
        (lastNameControl && lastNameControl.invalid) || 
        (contactNumberControl && contactNumberControl.invalid)) {
      return;
    }

    this.isLoading = true;
    
    // Create profile data without email
    const profileData = {
      firstName: firstNameControl?.value,
      lastName: lastNameControl?.value,
      contactNumber: contactNumberControl?.value
    };
    
    this.userService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.formSubmitted = false; // Reset form submitted state to hide validation errors
        
        if (response && response.status === 'success') {
          this.toastService.showSuccess('Profile updated successfully');
          
          // Update local user data if server returns the updated user
          if (response.data) {
            this.currentUser = response.data;
          } else if (this.currentUser) {
            // Otherwise update from form values
            this.currentUser = {
              ...this.currentUser,
              ...profileData
            };
          }
        } else {
          this.toastService.showError('Profile update response was invalid');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Failed to update profile';
        this.apiError = errorMsg;
        this.toastService.showError(errorMsg);
        console.error('Profile update error:', error);
      }
    });
  }

  changePassword(): void {
    this.passwordFormSubmitted = true;
    this.passwordApiError = null;
    
    if (this.passwordForm.invalid) {
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.isLoading = true;

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response && response.status === 'success') {
          this.passwordFormSubmitted = false; // Reset form submission state
          this.passwordForm.reset();
          this.showPasswordForm = false;
          this.toastService.showSuccess('Password changed successfully');
        } else {
          this.toastService.showError('Unexpected response while changing password');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Failed to change password';
        this.passwordApiError = errorMsg;
        this.toastService.showError(errorMsg);
        console.error('Password change error:', error);
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
      this.passwordFormSubmitted = false;
      this.passwordApiError = null;
    }
  }

  private passwordMatchValidator(formGroup: FormGroup): { mismatch: boolean } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
} 