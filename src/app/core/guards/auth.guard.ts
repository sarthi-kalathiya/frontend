import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    console.log('AuthGuard: Checking if user is logged in');
    try {
      const isLoggedIn = this.authService.isLoggedIn();
      console.log('AuthGuard: User is logged in:', isLoggedIn);
      
      if (isLoggedIn) {
        // Check if route has required roles
        const requiredRoles = route.data['roles'] as Array<string>;
        console.log('AuthGuard: Required roles:', requiredRoles);
        
        if (requiredRoles && requiredRoles.length > 0) {
          const userRole = this.authService.getUserRole();
          console.log('AuthGuard: User role:', userRole);
          
          const hasRequiredRole = requiredRoles.includes(userRole || '');
          console.log('AuthGuard: User has required role:', hasRequiredRole);
          
          if (!hasRequiredRole) {
            // If user doesn't have the required role, redirect to their appropriate dashboard
            console.log('AuthGuard: User does not have required role, redirecting based on role');
            this.navigateBasedOnRole();
            return false;
          }
        }
        
        return true;
      }
      
      // Redirect to login with return URL
      console.log('AuthGuard: User is not logged in, redirecting to login');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    } catch (error) {
      console.error('AuthGuard Error:', error);
      // If there's an error, redirect to login for safety
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
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