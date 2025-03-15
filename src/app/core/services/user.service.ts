import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get users with pagination
  getUsers(filters: UserFilter = {}): Observable<PaginatedResponse<any>> {
    // Build query params
    let params = new HttpParams();
    
    if (filters.page) params = params.append('page', filters.page.toString());
    if (filters.pageSize) params = params.append('pageSize', filters.pageSize.toString());
    if (filters.searchTerm) params = params.append('searchTerm', filters.searchTerm);
    if (filters.role && filters.role !== 'All Roles') params = params.append('role', filters.role);
    if (filters.isActive !== undefined) {
      params = params.append('isActive', filters.isActive.toString());
    }

    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/user/admin/users`, { params });
  }

  // Get user by ID
  getUserById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/admin/users/${userId}`);
  }

  // Create user
  createUser(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/admin/users`, userData);
  }

  // Update user
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/admin/users/${userId}`, userData);
  }

  // Update user status
  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/user/admin/users/${userId}/status`, { isActive });
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/user/admin/users/${userId}`);
  }
} 