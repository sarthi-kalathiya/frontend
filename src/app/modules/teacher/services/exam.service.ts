import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  constructor(private http: HttpClient) {}

  getTeacherExams(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Exam>> {
    return this.http.get<PaginatedResponse<Exam>>(`${API_URL}/teacher/exams`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getExamById(id: string): Observable<Exam> {
    return this.http.get<{ status: string; message: string; data: Exam }>(`${API_URL}/exams/${id}`).pipe(
      map(response => response.data)
    );
  }

  createExam(data: Partial<Exam>): Observable<Exam> {
    return this.http.post<{ status: string; message: string; data: Exam }>(`${API_URL}/exams`, data).pipe(
      map(response => response.data)
    );
  }

  updateExam(id: string, data: Partial<Exam>): Observable<Exam> {
    return this.http.put<{ status: string; message: string; data: Exam }>(`${API_URL}/exams/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  updateExamStatus(id: string, isActive: boolean): Observable<Exam> {
    return this.http.patch<{ status: string; message: string; data: Exam }>(`${API_URL}/exams/${id}/status`, { isActive }).pipe(
      map(response => response.data)
    );
  }

  deleteExam(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/exams/${id}`);
  }
}