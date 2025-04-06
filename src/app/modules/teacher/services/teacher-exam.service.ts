import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
} 