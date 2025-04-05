import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '@shared/components/action-menu/action-menu.component';
import { ExamService, Exam } from '../../services/exam.service';
import { SubjectService } from '@app/core/services/subject.service';
import { HttpClientModule } from '@angular/common/http';
import { Subject as RxjsSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs/operators';
import { AddExamModalComponent } from './add-exam-modal/add-exam-modal.component';
import { ViewExamModalComponent } from './view-exam-modal/view-exam-modal.component';
import { EditExamModalComponent } from './edit-exam-modal/edit-exam-modal.component';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionMenuComponent,
    HttpClientModule,
    AddExamModalComponent,
    ViewExamModalComponent,
    EditExamModalComponent,
  ],
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.scss'],
})
export class ExamsComponent implements OnInit, OnDestroy {
  // States
  isLoading = true;
  isLoadingSubjects = false;
  error: string | null = null;
  showAddExamModal = false;
  showViewExamModal = false;
  showEditExamModal = false;
  selectedExamId: string | null = null;

  // Filters
  searchTerm = '';
  selectedStatus: string = '';
  selectedSubject: string = '';
  selectedSubjectName: string = 'All Subjects';
  showStatusDropdown: boolean = false;
  showSubjectDropdown: boolean = false;
  subjects: any[] = []; // Will be populated from the API

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Data
  exams: Exam[] = [];
  filteredExams: Exam[] = [];

  // For cleanup
  private destroy$ = new RxjsSubject<void>();
  private searchSubject = new RxjsSubject<string>();

  // Make Math available to template
  protected readonly Math = Math;

  constructor(
    private examService: ExamService,
    private subjectService: SubjectService
  ) {
    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFilteredExams();
      });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.showStatusDropdown = false;
      this.showSubjectDropdown = false;
    });
  }

  ngOnInit(): void {
    this.loadSubjects();
    this.loadExams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubjects(): void {
    this.isLoadingSubjects = true;
    
    this.subjectService.getMySubjects()
      .pipe(finalize(() => this.isLoadingSubjects = false))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.subjects = response.data;
          }
        },
        error: (error: any) => {
          console.error('Failed to load subjects:', error);
        }
      });
  }

  loadExams(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    this.examService.getTeacherExams(page, this.pageSize).subscribe({
      next: (response) => {
        if (
          !response ||
          !response.data ||
          !response.data.exams ||
          !response.data.pagination
        ) {
          this.error = 'Invalid response from server';
          return;
        }

        this.exams = response.data.exams;
        this.filteredExams = [...this.exams];
        this.totalItems = response.data.pagination.total;
        this.totalPages = response.data.pagination.totalPages;
        this.currentPage = page;
      },
      error: (error: Error) => {
        console.error('Failed to load exams:', error);
        this.error = error.message || 'Failed to load exams';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  // Search and filter methods
  loadFilteredExams(): void {
    this.isLoading = true;
    this.error = null;

    // Create query params object
    const params: any = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    // Add search term if exists
    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    }

    // Add status filter if selected
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    // Add subject filter if selected
    if (this.selectedSubject) {
      params.subjectId = this.selectedSubject;
    }

    // Call API with filters - will return cached data if available
    this.examService.getFilteredTeacherExams(params).subscribe({
      next: (response: any) => {
        if (
          !response ||
          !response.data ||
          !response.data.exams ||
          !response.data.pagination
        ) {
          this.error = 'Invalid response from server';
          return;
        }

        this.exams = response.data.exams;
        this.filteredExams = [...this.exams];
        this.totalItems = response.data.pagination.total;
        this.totalPages = response.data.pagination.totalPages;
      },
      error: (error: Error) => {
        console.error('Failed to load filtered exams:', error);
        this.error = error.message || 'Failed to load exams';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  toggleStatusDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showStatusDropdown = !this.showStatusDropdown;
    if (this.showStatusDropdown) {
      this.showSubjectDropdown = false;
    }
  }

  toggleSubjectDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSubjectDropdown = !this.showSubjectDropdown;
    if (this.showSubjectDropdown) {
      this.showStatusDropdown = false;
      
      // Load subjects if not already loaded
      if (this.subjects.length === 0 && !this.isLoadingSubjects) {
        this.loadSubjects();
      }
    }
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.currentPage = 1; // Reset to first page when filter changes
    this.loadFilteredExams();
  }

  selectSubject(subjectId: string, subjectName: string): void {
    this.selectedSubject = subjectId;
    this.selectedSubjectName = subjectName;
    this.showSubjectDropdown = false;
    this.currentPage = 1; // Reset to first page when filter changes
    this.loadFilteredExams();
  }

  // Modal methods
  openAddExamModal(): void {
    this.showAddExamModal = true;
  }

  closeAddExamModal(refresh?: boolean): void {
    this.showAddExamModal = false;
    if (refresh) {
      this.loadExams(this.currentPage);
    }
  }

  openViewExamModal(examId: string): void {
    this.selectedExamId = examId;
    this.showViewExamModal = true;
  }

  closeViewExamModal(): void {
    this.showViewExamModal = false;
    this.selectedExamId = null;
  }

  openEditExamModal(examId: string): void {
    this.selectedExamId = examId;
    this.showEditExamModal = true;
  }

  closeEditExamModal(refresh?: boolean): void {
    this.showEditExamModal = false;
    this.selectedExamId = null;
    if (refresh) {
      this.loadExams(this.currentPage);
    }
  }

  // Action menu methods
  getExamMenuItems(exam: Exam): ActionMenuItem[] {
    return [
      {
        id: exam.id,
        label: 'View Details',
        icon: 'far fa-file-alt',
        action: 'view',
      },
      {
        id: exam.id,
        label: 'Edit Exam',
        icon: 'far fa-edit',
        action: 'edit',
      },
      {
        id: exam.id,
        label: 'Manage Questions',
        icon: 'far fa-list-alt',
        action: 'questions',
      },
      {
        id: exam.id,
        label: 'Assign Students',
        icon: 'fas fa-user-plus',
        action: 'assign',
      },
      {
        id: exam.id,
        label: 'Export Results',
        icon: 'fas fa-download',
        action: 'export',
      },
      {
        id: exam.id,
        label: 'Delete',
        icon: 'far fa-trash-alt',
        action: 'delete',
        // class: 'delete',
      },
    ];
  }

  handleMenuAction(event: { action: string; id: string }): void {
    switch (event.action) {
      case 'view':
        this.openViewExamModal(event.id);
        break;
      case 'edit':
        this.openEditExamModal(event.id);
        break;
      case 'questions':
        this.navigateToQuestions(event.id);
        break;
      case 'assign':
        this.assignStudents(event.id);
        break;
      case 'export':
        this.exportResults(event.id);
        break;
      case 'delete':
        this.deleteExam(event.id);
        break;
    }
  }

  toggleExamStatus(examId: string): void {
    const exam = this.exams.find((e) => e.id === examId);
    if (!exam) return;

    this.examService.updateExamStatus(examId, !exam.isActive).subscribe({
      next: () => {
        this.loadExams(this.currentPage);
      },
      error: (error: Error) => {
        console.error('Failed to update exam status:', error);
      },
    });
  }

  navigateToQuestions(examId: string): void {
    // TODO: Implement navigation to questions management
  }

  assignStudents(examId: string): void {
    // TODO: Implement student assignment functionality
    console.log(`Assign students to exam ${examId}`);
  }

  exportResults(examId: string): void {
    // TODO: Implement results export functionality
    console.log(`Export results for exam ${examId}`);
  }

  deleteExam(examId: string): void {
    // TODO: Implement exam deletion with confirmation
    console.log(`Delete exam ${examId}`);
  }

  // Helper methods
  getStatusBadgeClass(exam: Exam): string {
    const currentDate = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (!exam.isActive) return 'badge-warning';
    if (startDate > currentDate) return 'badge-info';
    if (endDate < currentDate) return 'badge-secondary';
    return 'badge-success';
  }

  getStatusText(exam: Exam): string {
    const currentDate = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (!exam.isActive) return 'Draft';
    if (startDate > currentDate) return 'Upcoming';
    if (endDate < currentDate) return 'Completed';
    return 'Active';
  } 

  // Pagination methods
  onPageChange(page: number | '...'): void {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.currentPage = page;
      this.loadFilteredExams();
    }
  }

  getPageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      pages.push(this.totalPages);
    }

    return pages;
  }
}
