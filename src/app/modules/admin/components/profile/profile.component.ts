import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserData } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ProfileComponent implements OnInit {
  currentUser: UserData | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  editMode = false;
  showPasswordForm = false;
  isLoading = false;
  formSubmitted = false;
  passwordFormSubmitted = false;
  apiError = '';
  passwordApiError = '';

  // Debug property to display raw teacher data if needed
  teacherProfileData: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private location: Location,
    private toastService: ToastService
  ) {
    // Initialize forms
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      contactNumber: ['', Validators.required],
      // Teacher-specific fields
      qualification: [''],
      expertise: [''],
      experience: [0],
      bio: [''],
      // Student-specific fields
      rollNumber: [''],
      grade: [''],
      parentContactNumber: [''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    console.log('Profile component initialized');
    this.authService.user$.subscribe((user) => {
      console.log('Current user from auth service:', user);
      if (user) {
        this.currentUser = user;
        this.updateFormWithUserData();
      }
    });
  }

  private updateFormWithUserData(): void {
    console.log('Updating form with user data');
    // Get full user profile with role-specific data
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        console.log('Profile API response:', response);
        // Extract user data from response
        const userData = response.data;
        console.log('User data extracted:', userData);

        // Update base user fields
        this.profileForm.patchValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          contactNumber: userData.contactNumber || '',
        });

        console.log('User role:', userData.role);
        console.log('Teacher data exists:', !!userData.teacher);
        console.log('Full teacher data:', userData.teacher);

        // Update role-specific fields if they exist
        if (userData.role === 'TEACHER' && userData.teacher) {
          // Store teacher data for debugging
          this.teacherProfileData = userData.teacher;

          console.log('Patching teacher profile fields with:', {
            qualification: userData.teacher.qualification || '',
            expertise: userData.teacher.expertise || '',
            experience: userData.teacher.experience || 0,
            bio: userData.teacher.bio || '',
          });

          // Check for null or undefined values in teacher profile
          if (
            userData.teacher.qualification === null ||
            userData.teacher.qualification === undefined
          ) {
            console.error('Teacher qualification is null or undefined');
          }
          if (
            userData.teacher.expertise === null ||
            userData.teacher.expertise === undefined
          ) {
            console.error('Teacher expertise is null or undefined');
          }
          if (
            userData.teacher.experience === null ||
            userData.teacher.experience === undefined
          ) {
            console.error('Teacher experience is null or undefined');
          }
          if (
            userData.teacher.bio === null ||
            userData.teacher.bio === undefined
          ) {
            console.error('Teacher bio is null or undefined');
          }

          this.profileForm.patchValue({
            qualification: userData.teacher.qualification || '',
            expertise: userData.teacher.expertise || '',
            experience: userData.teacher.experience || 0,
            bio: userData.teacher.bio || '',
          });

          // Check if the form was successfully patched
          console.log('Form values after patching:', {
            qualification: this.profileForm.get('qualification')?.value,
            expertise: this.profileForm.get('expertise')?.value,
            experience: this.profileForm.get('experience')?.value,
            bio: this.profileForm.get('bio')?.value,
          });
        } else if (userData.role === 'STUDENT' && userData.student) {
          console.log('Patching student profile fields');
          this.profileForm.patchValue({
            rollNumber: userData.student.rollNumber || '',
            grade: userData.student.grade || '',
            parentContactNumber: userData.student.parentContactNumber || '',
          });
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.apiError = 'Unable to load profile data';
      },
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.formSubmitted = false;
    this.apiError = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.formSubmitted = false;
    this.apiError = '';
    this.updateFormWithUserData();
  }

  updateProfile(): void {
    this.formSubmitted = true;

    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.apiError = '';

    const profileData: any = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      contactNumber: this.profileForm.value.contactNumber,
    };

    console.log(
      'Current user role before updating profile:',
      this.currentUser?.role
    );

    // Add role-specific data if user has that role
    if (this.currentUser?.role === 'TEACHER') {
      console.log('Adding teacher profile data to update');
      profileData.teacherProfile = {
        qualification: this.profileForm.value.qualification,
        expertise: this.profileForm.value.expertise,
        experience: parseInt(this.profileForm.value.experience, 10) || 0,
        bio: this.profileForm.value.bio,
      };
      console.log(
        'Teacher profile data being sent:',
        profileData.teacherProfile
      );
    } else if (this.currentUser?.role === 'STUDENT') {
      profileData.studentProfile = {
        rollNumber: this.profileForm.value.rollNumber,
        grade: this.profileForm.value.grade,
        parentContactNumber: this.profileForm.value.parentContactNumber,
      };
    }

    console.log('Full profile data being sent:', profileData);

    this.userService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.editMode = false;
        this.toastService.showSuccess('Profile updated successfully');
        console.log('Profile update response:', response);

        // Update current user in auth service
        this.authService.refreshCurrentUser();
      },
      error: (err) => {
        this.isLoading = false;
        this.apiError = err.error?.message || 'Failed to update profile';
        console.error('Error updating profile:', err);
      },
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordFormSubmitted = false;
    this.passwordApiError = '';

    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  changePassword(): void {
    this.passwordFormSubmitted = true;

    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.passwordApiError = '';

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    this.userService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showPasswordForm = false;
        this.passwordForm.reset();
        this.toastService.showSuccess('Password changed successfully');
      },
      error: (err) => {
        this.isLoading = false;
        this.passwordApiError =
          err.error?.message || 'Failed to change password';
        console.error('Error changing password:', err);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { mismatch: true };
  };
}
