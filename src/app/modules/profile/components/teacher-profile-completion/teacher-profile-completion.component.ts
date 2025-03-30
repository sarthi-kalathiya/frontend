import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-profile-completion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-profile-completion.component.html',
  styleUrls: ['./teacher-profile-completion.component.scss']
})
export class TeacherProfileCompletionComponent implements OnInit {
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
    // Check if we're dealing with a teacher
    const userRole = this.authService.getUserRole();
    if (userRole !== 'TEACHER') {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Initialize the form with validation
    this.profileForm = this.formBuilder.group({
      qualification: ['', [Validators.required]],
      expertise: ['', [Validators.required]],
      experience: [0, [Validators.required, Validators.min(0)]],
      bio: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // Form getters for easier template access
  get qualification() { return this.profileForm.get('qualification'); }
  get expertise() { return this.profileForm.get('expertise'); }
  get experience() { return this.profileForm.get('experience'); }
  get bio() { return this.profileForm.get('bio'); }

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

    this.profileService.completeTeacherProfile(this.profileForm.value).subscribe({
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
          this.router.navigate(['/teacher/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to complete profile. Please try again.';
      }
    });
  }
}