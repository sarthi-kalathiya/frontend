import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, JwtPayload, LoginRequest, SignupRequest, UserData } from '../models/auth.models';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private jwtHelper = new JwtHelperService();
  private userSubject = new BehaviorSubject<UserData | null>(null);
  
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromLocalStorage();
  }

  private loadUserFromLocalStorage(): void {
    try {
      const token = this.getToken();
      if (token) {
        // First decode the token and set basic user info
        const decodedToken = this.jwtHelper.decodeToken(token);
        if (decodedToken) {
          // Check if we have stored user data in localStorage first
          const storedUserData = this.getStoredUserData();
          
          if (storedUserData) {
            // We have complete user data stored, use it
            this.userSubject.next(storedUserData);
          } else {
            // Create a minimal user object from the token for initial state
            const minimalUser: Partial<UserData> = {
              id: decodedToken.sub || '',
              email: decodedToken.email || '',
              role: decodedToken.role as UserData['role'],
              name: decodedToken.name || '',
              // Add default values for required properties
              firstName: decodedToken.firstName || '',
              lastName: decodedToken.lastName || '',
              contactNumber: '',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Set the minimal user data first to avoid empty state
            this.userSubject.next(minimalUser as UserData);
            
            // Then fetch the complete user profile to get full data
            this.fetchCurrentUser().subscribe({
              next: (userData) => {
                if (userData && userData.data) {
                  // Store the complete user data for future use
                  this.storeUserData(userData.data);
                  this.userSubject.next(userData.data);
                }
              },
              error: (error) => {
                console.error('Error fetching complete user data:', error);
                // Continue with minimal user data if fetch fails, no need to logout
              }
            });
          }
        } else {
          this.clearTokens();
          this.userSubject.next(null);
        }
      } else {
        this.userSubject.next(null);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      this.clearTokens();
      this.userSubject.next(null);
    }
  }

  // Store user data in localStorage
  private storeUserData(userData: UserData): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get stored user data from localStorage
  private getStoredUserData(): UserData | null {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        return null;
      }
    }
    return null;
  }

  // Fetch current user's complete profile data
  private fetchCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/profile`).pipe(
      catchError(error => {
        console.error('Failed to fetch user profile:', error);
        return throwError(() => error);
      })
    );
  }

  unifiedLogin(loginData: LoginRequest): Observable<AuthResponse> {
    console.log('Unified login request:', loginData);
    
    // Try admin login first
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData).pipe(
      tap(response => {
        console.log('Admin login response:', response);
        if (response.status === 'success' && response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          this.userSubject.next(response.data.user);
        }
      }),
      catchError(adminError => {
        console.log('Admin login failed, trying user login');
        
        // If admin login fails, try regular user login (teacher/student)
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData).pipe(
          tap(response => {
            console.log('User login response:', response);
            if (response.status === 'success' && response.data) {
              localStorage.setItem('accessToken', response.data.accessToken);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              this.userSubject.next(response.data.user);
            }
          }),
          catchError(userError => {
            console.error('Both admin and user login failed');
            // Return the user login error as it's likely more relevant
            return throwError(() => userError);
          })
        );
      })
    );
  }

  adminLogin(loginData: LoginRequest): Observable<AuthResponse> {
    console.log('Admin login request:', loginData);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData).pipe(
      tap(response => {
        console.log('Admin login response:', response);
        if (response.status === 'success' && response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          this.userSubject.next(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Admin login error:', error);
        return throwError(() => error);
      })
    );
  }

  adminSignup(signupData: SignupRequest): Observable<AuthResponse> {
    console.log('Admin signup request:', signupData);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/admin/signup`, signupData).pipe(
      tap(response => {
        console.log('Admin signup response:', response);
      }),
      catchError(error => {
        console.error('Admin signup error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('accessToken');
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }

  // Check if user profile is complete
  isProfileComplete(): boolean {
    const currentUser = this.userSubject.value;
    return currentUser ? !!currentUser.profileCompleted : false;
  }

  // Check profile status from the API
  checkProfileStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/profile-status`);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          this.userSubject.next(response.data.user);
        }
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Update the current user data (used after profile updates)
  updateUserData(userData: UserData): void {
    // Update the BehaviorSubject
    this.userSubject.next(userData);
    // Store the updated data in localStorage
    this.storeUserData(userData);
  }

  // Refresh the current user data from the server
  refreshCurrentUser(): void {
    this.fetchCurrentUser().subscribe({
      next: (response) => {
        if (response && response.data) {
          // Store the updated user data
          this.storeUserData(response.data);
          this.userSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
      }
    });
  }

  getUserRole(): string | null {
    const currentUser = this.userSubject.value;
    return currentUser ? currentUser.role : null;
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if the logged-in user needs to complete their profile
  redirectToProfileCompletionIfNeeded(): Observable<boolean> {
    return this.checkProfileStatus().pipe(
      map(response => {
        if (response && response.data && response.data.requiresAdditionalSetup) {
          // User needs to complete profile
          const userRole = this.getUserRole();
          if (userRole === 'TEACHER') {
            this.router.navigate(['/profile/teacher/complete']);
          } else if (userRole === 'STUDENT') {
            this.router.navigate(['/profile/student/complete']);
          }
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('Error checking profile status:', error);
        return of(false);
      })
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}