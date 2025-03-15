import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // If user is already logged in, redirect to appropriate dashboard
    if (this.authService.isLoggedIn()) {
      console.log('NoAuthGuard: User is already logged in, redirecting to dashboard');
      this.navigateBasedOnRole();
      return false;
    }
    
    // User is not logged in, allow access to auth pages
    return true;
  }

  private navigateBasedOnRole(): void {
    const role = this.authService.getUserRole();
    console.log('Navigating based on role:', role);
    
    switch(role) {
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
        this.router.navigate(['/auth/login']);
    }
  }
} 