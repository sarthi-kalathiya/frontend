import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  error = '';
  returnUrl: string = '/';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    console.log('Login Component: Return URL:', this.returnUrl);

    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.handlePostLoginNavigation();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Use the unified login method
    this.authService.unifiedLogin(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success' && response.data) {
          this.handlePostLoginNavigation();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error =
          err.error?.message ||
          'Failed to login. Please check your credentials.';
      },
    });
  }

  private handlePostLoginNavigation(): void {
    // Check if user needs to complete their profile first
    this.authService.checkProfileStatus().subscribe({
      next: (response) => {
        if (
          response &&
          response.data &&
          response.data.requiresAdditionalSetup
        ) {
          // User needs to complete profile first
          const userRole = this.authService.getUserRole();

          if (userRole === 'TEACHER') {
            this.router.navigate(['/profile/teacher/complete']);
          } else if (userRole === 'STUDENT') {
            this.router.navigate(['/profile/student/complete']);
          } else {
            // For other roles, just use normal routing
            this.redirectBasedOnRole();
          }
        } else {
          // Profile is complete or not required, proceed with normal routing
          this.redirectBasedOnRole();
        }
      },
      error: (error) => {
        console.error('Error checking profile status:', error);
        // On error, fall back to standard routing
        this.redirectBasedOnRole();
      },
    });
  }

  private redirectBasedOnRole(): void {
    // Get user role and redirect accordingly
    const role = this.authService.getUserRole();

    // Use return URL if it's not the default, otherwise route based on role
    if (this.returnUrl !== '/') {
      this.router.navigate([this.returnUrl]);
      return;
    }

    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'TEACHER':
        this.router.navigate(['/teacher/dashboard']);
        break;
      case 'STUDENT':
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        // If no role or unknown role, stay on login page
        break;
    }
  }
}
