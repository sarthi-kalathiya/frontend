import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SubjectFilter {
  searchTerm?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('SubjectService initialized with apiUrl:', this.apiUrl);
  }

  // Get all subjects with optional filtering
  getAllSubjects(filters: SubjectFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize) params = params.append('pageSize', filters.pageSize.toString());
    if (filters.searchTerm) params = params.append('searchTerm', filters.searchTerm);
    if (filters.includeInactive !== undefined) {
      params = params.append('includeInactive', filters.includeInactive.toString());
    }

    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    
    console.log('Making API call to:', url, 'with params:', params.toString());
    return this.http.get<any>(url, { params });
  }

  // Get subject by ID
  getSubjectById(subjectId: string): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.get<any>(`${url}/${subjectId}`);
  }

  // Create subject
  createSubject(subjectData: any): Observable<any> {
    // Ensure credits is a number
    if (subjectData.credits !== undefined) {
      subjectData.credits = Number(subjectData.credits);
    }
    
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.post<any>(`${url}/admin/subjects`, subjectData);
  }

  // Update subject
  updateSubject(subjectId: string, subjectData: any): Observable<any> {
    // Ensure credits is a number
    if (subjectData.credits !== undefined) {
      subjectData.credits = Number(subjectData.credits);
    }
    
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.put<any>(`${url}/admin/subjects/${subjectId}`, subjectData);
  }

  // Update subject status
  updateSubjectStatus(subjectId: string, isActive: boolean): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.patch<any>(`${url}/admin/subjects/${subjectId}/status`, { isActive });
  }

  // Delete subject
  deleteSubject(subjectId: string): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.delete<any>(`${url}/admin/subjects/${subjectId}`);
  }

  // Get subjects assigned to a user
  getUserSubjects(userId: string): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.get<any>(`${url}/admin/users/${userId}/subjects`);
  }

  // Assign multiple subjects to a user
  assignSubjectsToUser(userId: string, subjectIds: string[]): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.post<any>(`${url}/admin/users/${userId}/subjects`, { subjectIds });
  }

  // Assign a single subject to a user
  assignSubjectToUser(userId: string, subjectId: string): Observable<any> {
    // Ensure the URL ends with /subjects
    let url = `${this.apiUrl}`;
    if (!url.endsWith('/subjects')) {
      url = `${url}/subjects`;
    }
    return this.http.post<any>(`${url}/admin/users/${userId}/subjects/${subjectId}`, {});
  }
} 