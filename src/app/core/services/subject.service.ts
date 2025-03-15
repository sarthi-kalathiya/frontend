import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get all subjects
  getSubjects(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filters.status) params = params.append('status', filters.status);
    if (filters.searchTerm) params = params.append('searchTerm', filters.searchTerm);
    
    return this.http.get<any>(`${this.apiUrl}/subjects`, { params });
  }

  // Get subject by ID
  getSubjectById(subjectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjects/${subjectId}`);
  }

  // Create subject
  createSubject(subjectData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/subjects`, subjectData);
  }

  // Update subject
  updateSubject(subjectId: string, subjectData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/subjects/${subjectId}`, subjectData);
  }

  // Update subject status specifically
  updateSubjectStatus(subjectId: string, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/subjects/${subjectId}/status`, { isActive });
  }

  // Delete subject
  deleteSubject(subjectId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/subjects/${subjectId}`);
  }
} 