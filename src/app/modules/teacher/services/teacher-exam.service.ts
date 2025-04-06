import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Interface for student statistics
 */
export interface StudentStatistics {
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  bannedCount: number;
  averageScore: number;
  passRate: number;
  passCount: number;
}

/**
 * Interface for pagination
 */
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface for API response
 */
export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

/**
 * Interface for filtered students response
 */
export interface FilteredStudentsResponse {
  students: any[];
  pagination: Pagination;
  statistics: StudentStatistics;
}

/**
 * Interface for filter options
 */
export interface StudentFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherExamService {
  private apiUrl = `${environment.apiUrl}/teacher/exams`;

  constructor(private http: HttpClient) { }

  /**
   * Get all students assigned to an exam
   * @param examId The ID of the exam
   * @returns Observable with students data
   */
  getAssignedStudents(examId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/students`);
  }

  /**
   * Get filtered students with pagination
   * @param examId The ID of the exam
   * @param options Filter options (page, limit, search, status)
   * @returns Observable with filtered students, pagination and statistics
   */
  getFilteredStudents(examId: string, options: StudentFilterOptions = {}): Observable<ApiResponse<FilteredStudentsResponse>> {
    // Build query parameters
    let params = new HttpParams();
    
    if (options.page !== undefined) {
      params = params.append('page', options.page.toString());
    }
    
    if (options.limit !== undefined) {
      params = params.append('limit', options.limit.toString());
    }
    
    if (options.search) {
      params = params.append('search', options.search);
    }
    
    if (options.status) {
      params = params.append('status', options.status);
    }
    
    return this.http.get<ApiResponse<FilteredStudentsResponse>>(
      `${this.apiUrl}/${examId}/students/filtered`, 
      { params }
    );
  }

  /**
   * Get student statistics for an exam
   * @param examId The ID of the exam
   * @returns Observable with student statistics
   */
  getExamStudentStatistics(examId: string): Observable<ApiResponse<StudentStatistics>> {
    return this.http.get<ApiResponse<StudentStatistics>>(`${this.apiUrl}/${examId}/student-statistics`);
  }

  /**
   * Toggle student ban status (ban/unban)
   * @param examId The ID of the exam
   * @param studentId The ID of the student
   * @returns Observable with the updated ban status
   */
  toggleStudentBan(examId: string, studentId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${examId}/students/${studentId}/toggle-ban`, {});
  }

  /**
   * Get exam results
   * @param examId The ID of the exam
   * @returns Observable with exam results data
   */
  getExamResults(examId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/results`);
  }

  /**
   * Get a student's result for an exam
   * @param examId The ID of the exam
   * @param studentId The ID of the student
   * @returns Observable with the student's result
   */
  getStudentResult(examId: string, studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/students/${studentId}/result`);
  }

  /**
   * Get a student's answer sheet for an exam
   * @param examId The ID of the exam
   * @param studentId The ID of the student
   * @returns Observable with the student's answer sheet
   */
  getStudentAnswerSheet(examId: string, studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/students/${studentId}/answer-sheet`);
  }

  /**
   * Get a student's cheat logs for an exam
   * @param examId The ID of the exam
   * @param studentId The ID of the student
   * @returns Observable with the student's cheat logs
   */
  getStudentCheatLogs(examId: string, studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/students/${studentId}/cheat-logs`);
  }

  /**
   * Get banned students for an exam
   * @param examId The ID of the exam
   * @returns Observable with banned students data
   */
  getBannedStudents(examId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/banned-students`);
  }

  /**
   * Assign exam to students
   * @param examId The ID of the exam
   * @param studentIds Array of student IDs to assign
   * @returns Observable with the assignment result
   */
  assignExamToStudents(examId: string, studentIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${examId}/assign`, { studentIds });
  }

  /**
   * Get students eligible for assignment to an exam
   * @param examId The ID of the exam
   * @returns Observable with eligible students data
   */
  getEligibleStudents(examId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${examId}/eligible-students`);
  }
} 