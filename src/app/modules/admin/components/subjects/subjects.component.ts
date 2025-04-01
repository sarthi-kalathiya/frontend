import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SubjectService,
  SubjectFilter,
} from '../../../../core/services/subject.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddSubjectModalComponent } from './add-subject-modal/add-subject-modal.component';
import { ViewSubjectModalComponent } from './view-subject-modal/view-subject-modal.component';
import { EditSubjectModalComponent } from './edit-subject-modal/edit-subject-modal.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../../../shared/components/action-menu/action-menu.component';
import { ConfirmationModalService } from '../../../../core/services/confirmation-modal.service';
import { Subject as RxjsSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Subject {
  id: string;
  name: string;
  description: string;
  code?: string;
  credits?: number;
  status?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddSubjectModalComponent,
    ViewSubjectModalComponent,
    EditSubjectModalComponent,
    ActionMenuComponent,
  ],
})
export class SubjectsComponent implements OnInit, OnDestroy {
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  searchTerm: string = '';
  private searchSubject = new RxjsSubject<string>();
  private searchSubscription!: Subscription;
  selectedStatus: string = 'All Statuses';
  showStatusDropdown: boolean = false;
  showAddSubjectModal: boolean = false;
  showViewSubjectModal: boolean = false;
  showEditSubjectModal: boolean = false;
  selectedSubject: Subject | null = null;
  isLoading: boolean = false;
  error: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;

  // Math object reference for template
  Math = Math;

  constructor(
    private subjectService: SubjectService,
    private toastService: ToastService,
    private confirmationModalService: ConfirmationModalService
  ) {}

  @HostListener('document:click')
  closeDropdowns() {
    this.showStatusDropdown = false;
  }

  ngOnInit(): void {
    // Set up debounced search
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(400), // Wait 400ms after the user stops typing
        distinctUntilChanged() // Only emit if the value changed
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset to first page on search
        this.loadSubjects();
      });

    // Load initial subjects
    this.loadSubjects();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.error = '';

    // Create filters for the API
    const filters: SubjectFilter = {};
    if (this.searchTerm) {
      filters.searchTerm = this.searchTerm;
    }

    // Set filtering based on selected status
    if (this.selectedStatus === 'All Statuses') {
      // Show all subjects
      filters.includeInactive = true;
    } else if (this.selectedStatus === 'Inactive') {
      // Filter to show only inactive subjects
      filters.isActive = false;
    } else if (this.selectedStatus === 'Active') {
      // Filter to show only active subjects
      filters.isActive = true;
    }

    // Add pagination parameters
    filters.page = this.currentPage;
    filters.pageSize = this.pageSize;

    console.log('Loading subjects with filters:', filters);

    this.subjectService.getAllSubjects(filters).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        // Handle different response formats
        if (response) {
          if (response.data) {
            // Standard API response with data property
            this.subjects = response.data;

            // Get pagination info
            if (response.pagination) {
              this.totalItems = response.pagination.totalItems;
              this.totalPages = response.pagination.totalPages;
              this.currentPage = response.pagination.currentPage;
            } else {
              this.totalItems = this.subjects.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            }
          } else {
            // Fallback if response doesn't have a data property
            this.subjects = response;
            this.totalItems = response.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          }

          this.filteredSubjects = this.subjects;
        } else {
          this.error = 'Invalid response format';
          this.subjects = [];
          this.filteredSubjects = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to load subjects';
        console.error('Error loading subjects:', err);
      },
    });
  }

  applyFilters(): void {
    this.filteredSubjects = this.subjects.filter((subject) => {
      // Status filter
      if (this.selectedStatus === 'Active' && !subject.isActive) {
        return false;
      }
      if (this.selectedStatus === 'Inactive' && subject.isActive) {
        return false;
      }

      // Search term filter (already handled by API in most cases)
      if (this.searchTerm && !this.searchTermContains(subject)) {
        return false;
      }

      return true;
    });

    // Update pagination info based on filtered results
    this.totalItems = this.filteredSubjects.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  // Helper method to check if subject matches search term
  private searchTermContains(subject: Subject): boolean {
    const term = this.searchTerm.toLowerCase();
    return (
      subject.name.toLowerCase().includes(term) ||
      subject.description.toLowerCase().includes(term) ||
      (subject.code?.toLowerCase().includes(term) ?? false)
    );
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadSubjects();
  }

  // Generate an array of page numbers for pagination
  getPageNumbers(): number[] {
    const visiblePages = 5; // Number of page buttons to show
    const pages: number[] = [];

    if (this.totalPages <= visiblePages) {
      // If we have fewer pages than visible count, show all
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end based on current page
      let start = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
      let end = start + visiblePages - 1;

      // Adjust if end exceeds total pages
      if (end > this.totalPages) {
        end = this.totalPages;
        start = Math.max(1, end - visiblePages + 1);
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis indicators
      if (start > 1) {
        pages.unshift(1);
        if (start > 2) pages.splice(1, 0, -1); // -1 represents ellipsis
      }

      if (end < this.totalPages) {
        if (end < this.totalPages - 1) pages.push(-1); // -1 represents ellipsis
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  onSearch(): void {
    // For server-side filtering, reload subjects
    this.loadSubjects();
  }

  onStatusChange(): void {
    // For server-side filtering, reload subjects
    this.loadSubjects();
  }

  // Get menu items for a subject
  getMenuItems(subject: Subject): ActionMenuItem[] {
    return [
      {
        id: 'view',
        label: 'View',
        icon: 'fa-eye',
        action: 'view',
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'fa-edit',
        action: 'edit',
      },
      {
        id: 'toggle-status',
        label: subject.isActive ? 'Deactivate' : 'Activate',
        icon: subject.isActive ? 'fa-ban' : 'fa-check-circle',
        action: 'toggle-status',
      },
    ];
  }

  // Handle action from menu
  handleMenuAction(event: { action: string; id: string }): void {
    const subjectId = event.id;
    const action = event.action;

    switch (action) {
      case 'view':
        this.viewSubject(subjectId);
        break;
      case 'edit':
        this.editSubject(subjectId);
        break;
      case 'toggle-status':
        this.toggleSubjectStatus(subjectId);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  editSubject(subjectId: string): void {
    const subject = this.subjects.find((s) => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showEditSubjectModal = true;
    }
  }

  viewSubject(subjectId: string): void {
    const subject = this.subjects.find((s) => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showViewSubjectModal = true;
    }
  }

  toggleSubjectStatus(subjectId: string): void {
    const subject = this.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const newStatus = !subject.isActive;
    const actionName = newStatus ? 'activate' : 'deactivate';

    this.confirmationModalService
      .confirm({
        title: `Confirm ${actionName} subject`,
        message: `Are you sure you want to ${actionName} this subject?`,
        confirmButtonText: 'Yes, ' + actionName,
        cancelButtonText: 'Cancel',
        type: 'warning',
      })
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.subjectService
            .updateSubjectStatus(subjectId, newStatus)
            .subscribe({
              next: () => {
                // Update the local subject data first for immediate UI update
                const subjectIndex = this.subjects.findIndex(
                  (s) => s.id === subjectId
                );
                if (subjectIndex !== -1) {
                  this.subjects[subjectIndex].isActive = newStatus;

                  // Also update in filteredSubjects if it exists
                  const filteredIndex = this.filteredSubjects.findIndex(
                    (s) => s.id === subjectId
                  );
                  if (filteredIndex !== -1) {
                    this.filteredSubjects[filteredIndex].isActive = newStatus;
                  }
                }

                this.toastService.showSuccess(
                  `Subject ${actionName}d successfully`
                );
                // Reload subjects to ensure data consistency
                this.loadSubjects();
              },
              error: (err) => {
                this.toastService.showError(
                  err.error?.message || `Failed to ${actionName} subject`
                );
                console.error(`Error ${actionName}ing subject:`, err);
              },
            });
        }
      });
  }

  toggleStatusDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.currentPage = 1; // Reset to first page on filter change
    this.loadSubjects();
  }

  // Subject modal methods
  openAddSubjectModal(): void {
    this.showAddSubjectModal = true;
  }

  closeAddSubjectModal(refresh: boolean = false): void {
    this.showAddSubjectModal = false;

    // If refresh is true, reload the subjects list
    if (refresh) {
      this.loadSubjects();
    }
  }

  closeViewSubjectModal(): void {
    this.showViewSubjectModal = false;
    this.selectedSubject = null;
  }

  closeEditSubjectModal(refresh: boolean = false): void {
    this.showEditSubjectModal = false;
    this.selectedSubject = null;

    // If refresh is true, reload the subjects list
    if (refresh) {
      this.loadSubjects();
    }
  }

  refreshSubjects(): void {
    this.loadSubjects();
  }

  deleteSubject(id: string): void {
    this.confirmationModalService
      .confirm({
        title: 'Delete Subject',
        message:
          'Are you sure you want to delete this subject? This action cannot be undone.',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isLoading = true;
          this.subjectService.deleteSubject(id).subscribe({
            next: () => {
              this.toastService.showSuccess('Subject deleted successfully');
              this.loadSubjects();
            },
            error: (err) => {
              this.isLoading = false;
              this.toastService.showError(
                err.error?.message || 'Failed to delete subject'
              );
            },
          });
        }
      });
  }
}
