import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, debounceTime, filter, map, shareReplay, take, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  JwtPayload,
  LoginRequest,
  SignupRequest,
  UserData,
} from '../models/auth.models';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private jwtHelper = new JwtHelperService();
  private userSubject = new BehaviorSubject<UserData | null>(null);
  private fetchingProfile = false;
  private lastFetchTime = 0;
  private fetchMinInterval = 5000; // 5 seconds minimum between fetches

  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromLocalStorage();
  }

  private loadUserFromLocalStorage(): void {
    try {
      const token = this.getToken();
      if (token) {
        // First check if we have stored user data in localStorage
        const storedUserData = this.getStoredUserData();

        if (storedUserData) {
          // We have complete user data stored, use it
          this.userSubject.next(storedUserData);
        } else {
          // No stored user data, decode token and fetch profile
          const decodedToken = this.jwtHelper.decodeToken(token);
          if (decodedToken) {
            // Create a minimal user object from the token for initial state
            const minimalUser: Partial<UserData> = {
              id: decodedToken.id || '',
              email: decodedToken.email || '',
              role: decodedToken.role as UserData['role'],
              firstName: decodedToken.firstName || '',
              lastName: decodedToken.lastName || '',
              contactNumber: '',
              isActive: true,
              profileCompleted: false, // Default to incomplete until fetched
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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
              },
            });
          } else {
            this.clearTokens();
            this.userSubject.next(null);
          }
        }
      } else {
        this.userSubject.next(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
    const now = Date.now();
    
    // If we recently fetched the profile, wait a bit before making another request
    if (this.fetchingProfile || (now - this.lastFetchTime < this.fetchMinInterval)) {
      console.log('Profile fetch already in progress or too recent, throttling request');
      return timer(this.fetchMinInterval).pipe(
        take(1),
        switchMap(() => this.fetchCurrentUser())
      );
    }
    
    this.fetchingProfile = true;
    this.lastFetchTime = now;
    
    console.log('Fetching current user profile from API');
    return this.http.get<any>(`${this.apiUrl}/user/profile`).pipe(
      tap(() => {
        console.log('Profile fetch completed');
        this.fetchingProfile = false;
      }),
      catchError((error) => {
        console.error('Failed to fetch user profile:', error);
        this.fetchingProfile = false;
        return throwError(() => error);
      }),
      shareReplay(1)  // Share the result with multiple subscribers
    );
  }

  unifiedLogin(loginData: LoginRequest): Observable<AuthResponse> {
    console.log('Unified login request:', loginData);

    // Try admin login first
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData)
      .pipe(
        tap((response) => {
          console.log('Admin login response:', response);
          if (response.status === 'success' && response.data) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            // Store complete user data
            this.storeUserData(response.data.user);
            this.userSubject.next(response.data.user);
          }
        }),
        catchError((adminError) => {
          console.log('Admin login failed, trying user login');

          // If admin login fails, try regular user login (teacher/student)
          return this.http
            .post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData)
            .pipe(
              tap((response) => {
                console.log('User login response:', response);
                if (response.status === 'success' && response.data) {
                  localStorage.setItem(
                    'accessToken',
                    response.data.accessToken
                  );
                  localStorage.setItem(
                    'refreshToken',
                    response.data.refreshToken
                  );
                  // Store complete user data
                  this.storeUserData(response.data.user);
                  this.userSubject.next(response.data.user);
                }
              }),
              catchError((userError) => {
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
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/signin`, loginData)
      .pipe(
        tap((response) => {
          console.log('Admin login response:', response);
          if (response.status === 'success' && response.data) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            // Store complete user data
            this.storeUserData(response.data.user);
            this.userSubject.next(response.data.user);
          }
        }),
        catchError((error) => {
          console.error('Admin login error:', error);
          return throwError(() => error);
        })
      );
  }

  adminSignup(signupData: SignupRequest): Observable<AuthResponse> {
    console.log('Admin signup request:', signupData);
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/admin/signup`, signupData)
      .pipe(
        tap((response) => {
          console.log('Admin signup response:', response);
        }),
        catchError((error) => {
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

  // Check profile status from the API - keeping for backward compatibility
  checkProfileStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/profile-status`);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => {
          if (response.status === 'success' && response.data) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            this.userSubject.next(response.data.user);
          }
        }),
        catchError((error) => {
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
    // Only fetch if the user is logged in
    if (!this.isLoggedIn()) {
      return;
    }
    
    console.log('Refreshing user data from server');
    this.fetchCurrentUser().subscribe({
      next: (response) => {
        if (response && response.data) {
          // Store the updated user data
          this.storeUserData(response.data);
          this.userSubject.next(response.data);
          console.log('User data refreshed successfully');
        }
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
      },
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
    const currentUser = this.userSubject.value;
    
    // If no user data is available yet, wait for it
    if (!currentUser) {
      return this.user$.pipe(
        filter(user => !!user),
        take(1),
        map(user => {
          if (user && !user.profileCompleted) {
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
        })
      );
    }
    
    // Use the profileCompleted field directly from the user data
    if (!currentUser.profileCompleted) {
      // User needs to complete profile
      const userRole = this.getUserRole();
      if (userRole === 'TEACHER') {
        this.router.navigate(['/profile/teacher/complete']);
      } else if (userRole === 'STUDENT') {
        this.router.navigate(['/profile/student/complete']);
      }
      return of(true);
    }
    
    return of(false);
  }

  // Get the current user data directly (for use by other services)
  getCurrentUser(): UserData | null {
    return this.userSubject.value;
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
