import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../../../core/services/subject.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddSubjectModalComponent } from './add-subject-modal/add-subject-modal.component';
import { ViewSubjectModalComponent } from './view-subject-modal/view-subject-modal.component';
import { EditSubjectModalComponent } from './edit-subject-modal/edit-subject-modal.component';
import { ActionMenuComponent, ActionMenuItem } from '../../../../shared/components/action-menu/action-menu.component';

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
    ActionMenuComponent
  ]
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  searchTerm: string = '';
  selectedStatus: string = 'All Statuses';
  showStatusDropdown: boolean = false;
  showAddSubjectModal: boolean = false;
  showViewSubjectModal: boolean = false;
  showEditSubjectModal: boolean = false;
  selectedSubject: Subject | null = null;
  isLoading: boolean = false;
  error: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}
  
  @HostListener('document:click')
  closeDropdowns() {
    this.showStatusDropdown = false;
  }
  
  ngOnInit(): void {
    this.loadSubjects();
  }
  
  loadSubjects(): void {
    this.isLoading = true;
    this.error = '';
    
    // Create filters for the API
    const filters: any = {};
    if (this.searchTerm) {
      filters.searchTerm = this.searchTerm;
    }
    
    // Set includeInactive based on selected status
    if (this.selectedStatus === 'All Statuses') {
      filters.includeInactive = true;
    } else if (this.selectedStatus === 'Inactive') {
      filters.includeInactive = true;
    } else {
      filters.includeInactive = false;
    }
    
    // Add pagination parameters
    filters.page = this.currentPage;
    filters.pageSize = this.pageSize;
    
    console.log('Loading subjects with filters:', filters);
    
    this.subjectService.getAllSubjects(filters).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
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
          } else if (Array.isArray(response)) {
            // Direct array response
            this.subjects = response;
            this.totalItems = response.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          } else if (response.status === 'success' && Array.isArray(response.data)) {
            // Success response format with data array
            this.subjects = response.data;
            
            // Check if pagination is embedded in the response
            if (response.pagination) {
              this.totalItems = response.pagination.totalItems;
              this.totalPages = response.pagination.totalPages;
              this.currentPage = response.pagination.currentPage || this.currentPage;
            } else {
              this.totalItems = this.subjects.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            }
          } else {
            console.error('Unexpected response format:', response);
            this.error = 'Invalid response format from server';
            this.subjects = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
        } else {
          this.subjects = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
        
        this.applyFilters(); // Apply client-side filtering for any additional filtering
      },
      error: (err: any) => {
        console.error('Error loading subjects:', err);
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to load subjects';
        
        // Fallback to mock data in case of error during development
        this.loadMockSubjects();
      }
    });
  }
  
  loadMockSubjects(): void {
    this.subjects = [
      {
        id: '1',
        name: 'Mathematics',
        description: 'Study of numbers, quantities, and shapes',
        code: 'MATH-101',
        credits: 4,
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Science',
        description: 'Study of the natural world',
        code: 'SCI-101',
        credits: 3,
        isActive: true,
        createdAt: '2024-01-20T14:45:00Z',
        updatedAt: '2024-01-20T14:45:00Z'
      },
      {
        id: '3',
        name: 'English',
        description: 'Study of language and literature',
        code: 'ENG-101',
        credits: 3,
        isActive: true,
        createdAt: '2024-01-25T09:15:00Z',
        updatedAt: '2024-01-25T09:15:00Z'
      },
      {
        id: '4',
        name: 'History',
        description: 'Study of past events',
        code: 'HIST-101',
        credits: 3,
        isActive: false,
        createdAt: '2024-02-01T11:20:00Z',
        updatedAt: '2024-02-01T11:20:00Z'
      },
      {
        id: '5',
        name: 'Geography',
        description: 'Study of places and the relationships between people and their environments',
        code: 'GEO-101',
        credits: 3,
        isActive: true,
        createdAt: '2024-02-05T13:40:00Z',
        updatedAt: '2024-02-05T13:40:00Z'
      }
    ];
    
    this.applyFilters();
  }
  
  applyFilters(): void {
    this.filteredSubjects = this.subjects.filter(subject => {
      // Filter by search term
      const matchesSearch = !this.searchTerm || 
        subject.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        subject.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = this.selectedStatus === 'All Statuses' || 
        (this.selectedStatus === 'Active' && subject.isActive) || 
        (this.selectedStatus === 'Inactive' && !subject.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }
  
  onSearch(): void {
    // For server-side filtering, reload subjects
    this.loadSubjects();
  }
  
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    
    // Debounce search to avoid excessive API calls
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => {
      this.loadSubjects();
    }, 300);
  }
  
  private _searchTimeout: any;
  
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
        action: 'view'
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'fa-edit',
        action: 'edit'
      },
      {
        id: 'toggle-status',
        label: subject.isActive ? 'Deactivate' : 'Activate',
        icon: subject.isActive ? 'fa-ban' : 'fa-check-circle',
        action: 'toggle-status'
      }
    ];
  }
  
  // Handle action from menu
  handleMenuAction(event: {action: string, id: string}): void {
    const subjectId = event.id;
    const action = event.action;
    
    switch(action) {
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
    const subject = this.subjects.find(s => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showEditSubjectModal = true;
    }
  }
  
  viewSubject(subjectId: string): void {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showViewSubjectModal = true;
    }
  }
  
  toggleSubjectStatus(subjectId: string): void {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    const newStatus = !subject.isActive;
    const actionName = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${actionName} this subject?`)) {
      this.subjectService.updateSubjectStatus(subjectId, newStatus).subscribe({
        next: () => {
          this.toastService.showSuccess(`Subject ${actionName}d successfully`);
          // Reload subjects
          this.loadSubjects();
        },
        error: (err) => {
          this.toastService.showError(err.error?.message || `Failed to ${actionName} subject`);
          console.error(`Error ${actionName}ing subject:`, err);
        }
      });
    }
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
    this.onStatusChange();
  }
  
  // Subject modal methods
  openAddSubjectModal(): void {
    this.showAddSubjectModal = true;
  }
  
  closeAddSubjectModal(refresh?: boolean): void {
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
  
  closeEditSubjectModal(refresh?: boolean): void {
    this.showEditSubjectModal = false;
    this.selectedSubject = null;
    
    // If refresh is true, reload the subjects list
    if (refresh) {
      this.loadSubjects();
    }
  }
} 