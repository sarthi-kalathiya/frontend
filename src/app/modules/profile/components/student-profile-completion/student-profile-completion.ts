import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-student-profile-completion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-profile-completion.component.html',
  styleUrls: ['./student-profile-completion.component.scss']
})
export class StudentProfileCompletionComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if we're dealing with a student
    const userRole = this.authService.getUserRole();
    if (userRole !== 'STUDENT') {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Initialize the form with validation - removing contactNumber as it's not needed
    this.profileForm = this.formBuilder.group({
      rollNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      grade: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\s-]+$/)]],
      parentContactNumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{10,}$/)]]
    });
  }

  // Form getters for easier template access
  get rollNumber() { return this.profileForm.get('rollNumber'); }
  get grade() { return this.profileForm.get('grade'); }
  get parentContactNumber() { return this.profileForm.get('parentContactNumber'); }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      // Mark all fields as touched to trigger validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Submit the form - no need to filter out contactNumber since it's not in the form anymore
    this.profileService.completeStudentProfile(this.profileForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Profile completed successfully!';
        
        // Update user data in auth service
        if (response && response.data) {
          this.authService.updateUserData(response.data);
        }
        
        // Refresh current user to ensure the profile status is updated
        this.authService.refreshCurrentUser();
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          this.router.navigate(['/student/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to complete profile. Please try again.';
      }
    });
  }
} 