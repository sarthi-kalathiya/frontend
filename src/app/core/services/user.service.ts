import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserData } from '../models/auth.models';
import { CacheService } from './cache.service';
import { AuthService } from './auth.service';

// Define response types
export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UserFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private cachePrefix = 'user_service_';

  constructor(
    private http: HttpClient, 
    private cacheService: CacheService,
    private authService: AuthService
  ) {}

  // Get users with pagination
  getUsers(filters: UserFilter = {}): Observable<PaginatedResponse<any>> {
    // Build query params
    let params = new HttpParams();

    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize)
      params = params.append('pageSize', filters.pageSize.toString());
    if (filters.searchTerm)
      params = params.append('searchTerm', filters.searchTerm);
    if (filters.role && filters.role !== 'All Roles')
      params = params.append('role', filters.role);
    if (filters.isActive !== undefined) {
      params = params.append('isActive', filters.isActive.toString());
    }

    // Generate cache key based on the request parameters
    const cacheKey =
      this.cachePrefix + 'users_' + this.objectToQueryString(filters);

    // Check cache first
    const cachedData = this.cacheService.get<PaginatedResponse<any>>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, make the HTTP request
    return this.http
      .get<PaginatedResponse<any>>(`${this.apiUrl}/user/admin/users`, {
        params,
      })
      .pipe(
        tap((response) => {
          // Save the response to cache
          this.cacheService.set(cacheKey, response);
        }),
        catchError((error) => {
          console.error('Error fetching users:', error);
          throw error;
        })
      );
  }

  // Get user by ID
  getUserById(userId: string): Observable<any> {
    const cacheKey = this.cachePrefix + 'user_' + userId;

    // Check cache first
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<any>(`${this.apiUrl}/user/admin/users/${userId}`).pipe(
      tap((response) => {
        // Save the response to cache
        this.cacheService.set(cacheKey, response);
      })
    );
  }

  // Create user
  createUser(userData: any): Observable<any> {
    // Clear users cache when creating a new user
    this.clearUsersCache();

    return this.http.post<any>(`${this.apiUrl}/user/admin/users`, userData);
  }

  // Update user
  updateUser(userId: string, userData: any): Observable<any> {
    // Clear user and users cache when updating
    this.cacheService.remove(this.cachePrefix + 'user_' + userId);
    this.clearUsersCache();

    return this.http.put<any>(
      `${this.apiUrl}/user/admin/users/${userId}`,
      userData
    );
  }

  // Update user subjects
  updateUserSubjects(userId: string, subjectIds: string[]): Observable<any> {
    // Clear user cache when updating subjects
    this.cacheService.remove(this.cachePrefix + 'user_' + userId);

    return this.http.patch<any>(
      `${this.apiUrl}/user/admin/users/${userId}/subjects`,
      { subjectIds }
    );
  }

  // Update user status
  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    // Clear user and users cache when updating status
    this.cacheService.remove(this.cachePrefix + 'user_' + userId);
    this.clearUsersCache();

    return this.http.patch<any>(
      `${this.apiUrl}/user/admin/users/${userId}/status`,
      { isActive }
    );
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    // Clear users cache when deleting a user
    this.clearUsersCache();

    return this.http.delete<any>(`${this.apiUrl}/user/admin/users/${userId}`);
  }

  // Get current user profile
  getUserProfile(): Observable<any> {
    const cacheKey = this.cachePrefix + 'profile';
    
    // First, try to get the user data from the AuthService
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      console.log('Using user data from AuthService:', currentUser);
      // Return the user data from AuthService
      return of({
        status: 'success',
        data: currentUser
      });
    }
    
    // Next, check the cache
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log('Using cached profile data');
      return of(cachedData);
    }
    
    // If not available, make the API call
    console.log('Fetching user profile from API');
    return this.http.get(`${this.apiUrl}/user/profile`).pipe(
      tap((response) => {
        console.log('User profile API response:', response);
        // Cache the response
        this.cacheService.set(cacheKey, response);
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of({
          status: 'error',
          message: 'Failed to fetch user profile',
          data: null
        });
      })
    );
  }

  // Update current user profile
  updateUserProfile(profileData: Partial<UserData>): Observable<any> {
    // Clear profile cache when updating
    this.cacheService.remove(this.cachePrefix + 'profile');

    // Add type information to the HTTP request
    interface ProfileResponse {
      status: string;
      data: UserData;
      message: string;
    }

    return this.http.put<ProfileResponse>(`${this.apiUrl}/user/profile`, profileData).pipe(
      tap(response => {
        // If the update was successful and we have user data in the response
        if (response && response.status === 'success' && response.data) {
          // Update the AuthService with the new user data
          this.authService.updateUserData(response.data);
          
          // Update the cache
          this.cacheService.set(this.cachePrefix + 'profile', response);
        }
      })
    );
  }

  // Change current user password
  changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/user/password`, passwordData);
  }

  // Clear all user list related cache entries
  clearUsersCache(): void {
    this.cacheService.clearByPrefix(this.cachePrefix + 'users_');
  }

  // Helper method to convert an object to a query string for cache keys
  private objectToQueryString(obj: any): string {
    return Object.entries(obj)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}
