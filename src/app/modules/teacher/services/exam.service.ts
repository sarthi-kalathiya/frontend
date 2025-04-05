import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { CacheService } from '@app/core/services/cache.service';

const API_URL = 'http://localhost:3000/api';

export interface Exam {
  id: string;
  name: string;
  ownerId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
    description: string;
    credits: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  numQuestions: number;
  passingMarks: number;
  totalMarks: number;
  currentQuestionCount: number;
  currentTotalMarks: number;
  duration: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  subjectId?: string;
}

export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: {
    exams: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private cachePrefix = 'exam_service_';

  constructor(private http: HttpClient, private cacheService: CacheService) {}

  getTeacherExams(
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedResponse<Exam>> {
    return this.http.get<PaginatedResponse<Exam>>(`${API_URL}/teacher/exams`, {
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  getFilteredTeacherExams(filters: ExamFilter = {}): Observable<PaginatedResponse<Exam>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize) params = params.append('limit', filters.pageSize.toString());
    if (filters.searchTerm) params = params.append('searchTerm', filters.searchTerm);
    if (filters.status) params = params.append('status', filters.status);
    if (filters.subjectId) params = params.append('subjectId', filters.subjectId);
    
    // Generate cache key based on the request parameters
    const cacheKey = this.cachePrefix + 'filtered_exams_' + this.objectToQueryString(filters);
    
    // Check cache first
    const cachedData = this.cacheService.get<PaginatedResponse<Exam>>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    // If not in cache, make API call
    return this.http.get<PaginatedResponse<Exam>>(`${API_URL}/teacher/exams`, { params })
      .pipe(
        tap(response => {
          // Save the response to cache
          this.cacheService.set(cacheKey, response);
        }),
        catchError(error => {
          console.error('Error fetching filtered exams:', error);
          throw error;
        })
      );
  }

  getExamById(id: string): Observable<Exam> {
    // Check cache first
    const cacheKey = this.cachePrefix + 'exam_' + id;
    const cachedData = this.cacheService.get<Exam>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.http
      .get<{ status: string; message: string; data: Exam }>(
        `${API_URL}/exams/${id}`
      )
      .pipe(
        map((response) => response.data),
        tap(exam => {
          // Save to cache
          this.cacheService.set(cacheKey, exam);
        })
      );
  }

  createExam(data: Partial<Exam>): Observable<Exam> {
    // Clear exams cache when creating a new exam
    this.clearExamsCache();
    
    return this.http
      .post<{ status: string; message: string; data: Exam }>(
        `${API_URL}/exams`,
        data
      )
      .pipe(map((response) => response.data));
  }

  updateExam(id: string, data: Partial<Exam>): Observable<Exam> {
    // Clear exams cache and specific exam cache
    this.clearExamsCache();
    this.cacheService.remove(this.cachePrefix + 'exam_' + id);
    
    return this.http
      .put<{ status: string; message: string; data: Exam }>(
        `${API_URL}/exams/${id}`,
        data
      )
      .pipe(map((response) => response.data));
  }

  updateExamStatus(id: string, isActive: boolean): Observable<Exam> {
    // Clear exams cache and specific exam cache
    this.clearExamsCache();
    this.cacheService.remove(this.cachePrefix + 'exam_' + id);
    
    return this.http
      .patch<{ status: string; message: string; data: Exam }>(
        `${API_URL}/exams/${id}/status`,
        { isActive }
      )
      .pipe(map((response) => response.data));
  }

  deleteExam(id: string): Observable<void> {
    // Clear exams cache and specific exam cache
    this.clearExamsCache();
    this.cacheService.remove(this.cachePrefix + 'exam_' + id);
    
    return this.http.delete<void>(`${API_URL}/exams/${id}`);
  }
  
  // Clear all exam list related cache entries
  clearExamsCache(): void {
    this.cacheService.clearByPrefix(this.cachePrefix + 'filtered_exams_');
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
