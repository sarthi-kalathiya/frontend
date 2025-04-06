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

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  hasImage: boolean;
  images: string[];
  marks: number;
  negativeMarks: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface CreateQuestionDto {
  questionText: string;
  hasImage?: boolean;
  images?: string[];
  marks?: number;
  negativeMarks?: number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
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
        `${API_URL}/teacher/exams/${id}`
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
        `${API_URL}/teacher/exams`,
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
        `${API_URL}/teacher/exams/${id}`,
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
        `${API_URL}/teacher/exams/${id}/status`,
        { isActive }
      )
      .pipe(map((response) => response.data));
  }

  deleteExam(id: string): Observable<void> {
    // Clear exams cache and specific exam cache
    this.clearExamsCache();
    this.cacheService.remove(this.cachePrefix + 'exam_' + id);
    
    return this.http.delete<void>(`${API_URL}/teacher/exams/${id}`);
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

  /**
   * Get student statistics for an exam
   * @param examId The ID of the exam
   * @returns Observable with enhanced student statistics
   */
  getExamStudentStats(examId: string): Observable<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    banned: number;
    averageScore: number;
    passRate: number;
    passCount: number;
    totalMarks: number;
    passingMarks: number;
  }> {
    const cacheKey = `${this.cachePrefix}exam_student_stats_${examId}`;
    const cachedData = this.cacheService.get<any>(cacheKey);
    
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.http
      .get<{ status: string; message: string; data: any }>(
        `${API_URL}/teacher/exams/${examId}/student-statistics`
      )
      .pipe(
        map((response) => {
          // Map the backend property names to the frontend property names
          const mappedData = {
            total: response.data.totalStudents,
            completed: response.data.completedCount,
            inProgress: response.data.inProgressCount,
            notStarted: response.data.notStartedCount,
            banned: response.data.bannedCount,
            averageScore: response.data.averageScore,
            passRate: response.data.passRate,
            passCount: response.data.passCount,
            totalMarks: response.data.totalMarks,
            passingMarks: response.data.passingMarks
          };
          
          this.cacheService.set(cacheKey, mappedData);
          return mappedData;
        })
      );
  }

  /**
   * Get questions for an exam
   * @param examId The ID of the exam
   * @returns Observable with exam questions
   */
  getExamQuestions(examId: string): Observable<Question[]> {
    const cacheKey = `${this.cachePrefix}exam_questions_${examId}`;
    const cachedData = this.cacheService.get<Question[]>(cacheKey);
    
    if (cachedData) {
      return of(cachedData);
    }
    
    return this.http
      .get<{ status: string; message: string; data: Question[] }>(
        `${API_URL}/teacher/exams/${examId}/questions`
      )
      .pipe(
        map((response) => {
          this.cacheService.set(cacheKey, response.data);
          return response.data;
        })
      );
  }

  /**
   * Add a new question to an exam
   * @param examId The ID of the exam
   * @param question The question to add
   * @returns Observable with the created question
   */
  addQuestion(examId: string, question: CreateQuestionDto): Observable<Question> {
    // Clear questions cache
    this.clearQuestionsCache(examId);
    
    return this.http
      .post<{ status: string; message: string; data: Question }>(
        `${API_URL}/teacher/exams/${examId}/question`, 
        question
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Update an existing question
   * @param examId The ID of the exam
   * @param questionId The ID of the question to update
   * @param question The updated question data
   * @returns Observable with the updated question
   */
  updateQuestion(examId: string, questionId: string, question: CreateQuestionDto): Observable<Question> {
    // Clear questions cache
    this.clearQuestionsCache(examId);
    
    return this.http
      .put<{ status: string; message: string; data: Question }>(
        `${API_URL}/teacher/exams/${examId}/questions/${questionId}`,
        question
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Delete a question
   * @param examId The ID of the exam
   * @param questionId The ID of the question to delete
   * @returns Observable with the operation result
   */
  deleteQuestion(examId: string, questionId: string): Observable<void> {
    // Clear questions cache
    this.clearQuestionsCache(examId);
    
    return this.http.delete<void>(
      `${API_URL}/teacher/exams/${examId}/questions/${questionId}`
    );
  }

  /**
   * Reorder questions in an exam
   * @param examId The ID of the exam
   * @param questionIds Array of question IDs in the new order
   * @returns Observable with the operation result
   */
  reorderQuestions(examId: string, questionIds: string[]): Observable<void> {
    // Clear questions cache
    this.clearQuestionsCache(examId);
    
    return this.http.post<void>(
      `${API_URL}/teacher/exams/${examId}/reorder-questions`,
      { questionIds }
    );
  }

  /**
   * Clear question-related cache for an exam
   * @param examId The ID of the exam
   */
  private clearQuestionsCache(examId: string): void {
    this.cacheService.remove(`${this.cachePrefix}exam_questions_${examId}`);
    // Also clear the exam cache as question changes may affect exam stats
    this.cacheService.remove(`${this.cachePrefix}exam_${examId}`);
  }
}
