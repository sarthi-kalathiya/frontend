import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '@shared/components/action-menu/action-menu.component';
import { ExamService, Exam } from '../../services/exam.service';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
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
  error: string | null = null;
  showAddExamModal = false;
  showViewExamModal = false;
  showEditExamModal = false;
  selectedExamId: string | null = null;

  // Filters
  searchTerm = '';
  selectedStatus = 'All Statuses';
  showStatusDropdown = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Data
  exams: Exam[] = [];
  filteredExams: Exam[] = [];

  // For cleanup
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Make Math available to template
  protected readonly Math = Math;

  constructor(private examService: ExamService) {
    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnInit(): void {
    this.loadExams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.exams];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.name.toLowerCase().includes(searchLower) ||
          exam.subject.name.toLowerCase().includes(searchLower) ||
          exam.subject.code.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.selectedStatus !== 'All Statuses') {
      filtered = filtered.filter((exam) => {
        const currentDate = new Date();
        const startDate = new Date(exam.startDate);
        const endDate = new Date(exam.endDate);

        switch (this.selectedStatus) {
          case 'Active':
            return (
              exam.isActive &&
              startDate <= currentDate &&
              endDate >= currentDate
            );
          case 'Draft':
            return !exam.isActive;
          case 'Upcoming':
            return exam.isActive && startDate > currentDate;
          case 'Completed':
            return exam.isActive && endDate < currentDate;
          default:
            return true;
        }
      });
    }

    this.filteredExams = filtered;
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
        icon: 'fas fa-eye',
        action: 'view',
      },
      {
        id: exam.id,
        label: 'Edit',
        icon: 'fas fa-edit',
        action: 'edit',
      },
      {
        id: exam.id,
        label: exam.isActive ? 'Deactivate' : 'Activate',
        icon: exam.isActive ? 'fas fa-ban' : 'fas fa-check',
        action: 'toggle-status',
      },
      {
        id: exam.id,
        label: 'Manage Questions',
        icon: 'fas fa-list',
        action: 'manage-questions',
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
      case 'toggle-status':
        this.toggleExamStatus(event.id);
        break;
      case 'manage-questions':
        this.navigateToQuestions(event.id);
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
      this.loadExams(page);
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
