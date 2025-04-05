import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

export interface SubjectFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  includeInactive?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private apiUrl = environment.apiUrl;
  private cachePrefix = 'subject_service_';

  constructor(private http: HttpClient, private cacheService: CacheService) {}

  // Get all subjects with optional filtering
  getAllSubjects(filters: SubjectFilter = {}): Observable<any> {
    let params = new HttpParams();

    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize)
      params = params.append('pageSize', filters.pageSize.toString());
    if (filters.searchTerm)
      params = params.append('searchTerm', filters.searchTerm);
    if (filters.includeInactive !== undefined) {
      params = params.append(
        'includeInactive',
        filters.includeInactive.toString()
      );
    }
    if (filters.isActive !== undefined) {
      params = params.append('isActive', filters.isActive.toString());
    }

    // Generate cache key based on the request parameters
    const cacheKey =
      this.cachePrefix + 'subjects_' + this.objectToQueryString(filters);

    // Check cache first
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<any>(`${this.apiUrl}/subjects`, { params }).pipe(
      tap((response) => {
        // Save the response to cache
        this.cacheService.set(cacheKey, response);
      }),
      catchError((error) => {
        console.error('Error fetching subjects:', error);
        throw error;
      })
    );
  }

  // Get subject by ID
  getSubjectById(subjectId: string): Observable<any> {
    const cacheKey = this.cachePrefix + 'subject_' + subjectId;

    // Check cache first
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<any>(`${this.apiUrl}/subjects/${subjectId}`).pipe(
      tap((response) => {
        // Save the response to cache
        this.cacheService.set(cacheKey, response);
      })
    );
  }

  // Create subject
  createSubject(subjectData: any): Observable<any> {
    // Ensure credits is a number
    if (subjectData.credits !== undefined) {
      subjectData.credits = Number(subjectData.credits);
    }

    // Clear subjects cache when creating a new subject
    this.clearSubjectsCache();

    return this.http.post<any>(
      `${this.apiUrl}/subjects/admin/subjects`,
      subjectData
    );
  }

  // Update subject
  updateSubject(subjectId: string, subjectData: any): Observable<any> {
    // Ensure credits is a number
    if (subjectData.credits !== undefined) {
      subjectData.credits = Number(subjectData.credits);
    }

    // Clear subject and subjects cache when updating
    this.cacheService.remove(this.cachePrefix + 'subject_' + subjectId);
    this.clearSubjectsCache();

    return this.http.put<any>(
      `${this.apiUrl}/subjects/admin/subjects/${subjectId}`,
      subjectData
    );
  }

  // Update subject status
  updateSubjectStatus(subjectId: string, isActive: boolean): Observable<any> {
    // Clear subject and subjects cache when updating status
    this.cacheService.remove(this.cachePrefix + 'subject_' + subjectId);
    this.clearSubjectsCache();

    return this.http.patch<any>(
      `${this.apiUrl}/subjects/admin/subjects/${subjectId}/status`,
      { isActive }
    );
  }

  // Delete subject
  deleteSubject(subjectId: string): Observable<any> {
    // Clear subjects cache when deleting a subject
    this.clearSubjectsCache();

    return this.http.delete<any>(
      `${this.apiUrl}/subjects/admin/subjects/${subjectId}`
    );
  }

  // Get subjects assigned to a user
  getUserSubjects(userId: string): Observable<any> {
    const cacheKey = this.cachePrefix + 'user_subjects_' + userId;

    // Check cache first
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http
      .get<any>(`${this.apiUrl}/subjects/admin/users/${userId}/subjects`)
      .pipe(
        tap((response) => {
          // Save the response to cache
          this.cacheService.set(cacheKey, response);
        })
      );
  }

  // Get current user's assigned subjects
  getMySubjects(): Observable<any> {
    const cacheKey = this.cachePrefix + 'my_subjects';

    // Check cache first
    const cachedData = this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http
      .get<any>(`${this.apiUrl}/subjects/my/subjects`)
      .pipe(
        tap((response) => {
          // Save the response to cache
          this.cacheService.set(cacheKey, response);
        }),
        catchError((error) => {
          console.error('Error fetching my subjects:', error);
          throw error;
        })
      );
  }

  // Assign subjects to a user
  assignSubjectsToUser(userId: string, subjectIds: string[]): Observable<any> {
    // Clear user subjects cache when assigning subjects
    this.cacheService.remove(this.cachePrefix + 'user_subjects_' + userId);

    return this.http.post<any>(
      `${this.apiUrl}/subjects/admin/users/${userId}/subjects`,
      { subjectIds }
    );
  }

  // Clear all subject list related cache entries
  clearSubjectsCache(): void {
    this.cacheService.clearByPrefix(this.cachePrefix + 'subjects_');
    // Also clear my subjects cache
    this.clearMySubjectsCache();
  }

  // Clear current user subjects cache
  clearMySubjectsCache(): void {
    this.cacheService.remove(this.cachePrefix + 'my_subjects');
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
