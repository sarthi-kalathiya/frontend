import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompletionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Only check for profile completion if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    // Get user's profile status
    return this.profileService.getProfileStatus().pipe(
      map((response) => {
        if (response.data && response.data.requiresAdditionalSetup) {
          // If profile not complete, redirect to appropriate profile completion page
          const userRole = this.authService.getUserRole();
          if (userRole === 'TEACHER') {
            this.router.navigate(['/profile/teacher/complete']);
          } else if (userRole === 'STUDENT') {
            this.router.navigate(['/profile/student/complete']);
          }
          return false;
        }
        // Profile is complete, allow access
        return true;
      }),
      catchError((error) => {
        console.error('Error checking profile completion status:', error);
        // On error, allow access to prevent blocking the user
        return of(true);
      })
    );
  }
}
