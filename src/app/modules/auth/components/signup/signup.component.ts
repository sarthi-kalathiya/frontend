import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group(
      {
        firstName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        lastName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
        contactNumber: [
          '',
          [Validators.required, Validators.pattern(/^\d{9,11}$/)],
        ],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  get firstName() {
    return this.signupForm.get('firstName');
  }
  get lastName() {
    return this.signupForm.get('lastName');
  }
  get email() {
    return this.signupForm.get('email');
  }
  get password() {
    return this.signupForm.get('password');
  }
  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }
  get contactNumber() {
    return this.signupForm.get('contactNumber');
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    // Extract form data without confirmPassword
    const { confirmPassword, ...signupData } = this.signupForm.value;

    console.log('Submitting signup form:', signupData);

    this.authService.adminSignup(signupData).subscribe({
      next: (response) => {
        console.log('Signup response received:', response);
        this.isLoading = false;

        // Check for success based on the API response structure
        if (response && response.status === 'success') {
          this.success =
            'Account created successfully. Redirecting to login...';
          this.signupForm.reset();

          // Navigate to login page after a delay
          console.log('Will redirect to login in 2 seconds');
          setTimeout(() => {
            console.log('Redirecting to login now');
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          // Handle unexpected response format
          console.error('Unexpected response format:', response);
          this.error = 'Received an unexpected response from the server.';
        }
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.error = err.error.message;
        } else if (err.message) {
          this.error = err.message;
        } else {
          this.error = 'Failed to create account. Please try again.';
        }
      },
    });
  }
}
