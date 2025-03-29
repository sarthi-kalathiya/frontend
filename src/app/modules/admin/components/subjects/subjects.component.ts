import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../../../core/services/subject.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddSubjectModalComponent } from './add-subject-modal/add-subject-modal.component';
import { ViewSubjectModalComponent } from './view-subject-modal/view-subject-modal.component';
import { EditSubjectModalComponent } from './edit-subject-modal/edit-subject-modal.component';
import { ActionMenuComponent, ActionMenuItem } from '../../../../shared/components/action-menu/action-menu.component';
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

interface CacheEntry {
  data: Subject[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: number;
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
  
  // Cache system
  private cache: { [key: string]: CacheEntry } = {};
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
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
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400), // Wait 400ms after the user stops typing
      distinctUntilChanged() // Only emit if the value changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on search
      this.loadSubjects();
    });
    
    // Load initial subjects
    this.loadSubjects();
    
    // Try to restore cache from sessionStorage
    const savedCache = sessionStorage.getItem('subjectsCache');
    if (savedCache) {
      try {
        this.cache = JSON.parse(savedCache);
        
        // Clean up any expired cache entries
        this.cleanExpiredCache();
      } catch (e) {
        console.error('Error parsing cached data', e);
        sessionStorage.removeItem('subjectsCache');
      }
    }
  }
  
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  
  loadSubjects(): void {
    // Create a cache key based on current filters
    const cacheKey = this.createCacheKey();
    
    // Check if we already have valid cached data
    if (this.cache[cacheKey] && this.isCacheValid(this.cache[cacheKey])) {
      console.log('Using cached data for', cacheKey);
      this.processCachedData(this.cache[cacheKey]);
      return;
    }
    
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
      filters.isActive = false;
    } else {
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
              
              // Cache the response with a timestamp
              this.cacheData(cacheKey, {
                data: response.data,
                pagination: {
                  total: response.pagination.totalItems,
                  page: response.pagination.currentPage,
                  pageSize: this.pageSize,
                  totalPages: response.pagination.totalPages
                },
                timestamp: Date.now()
              });
            } else {
              this.totalItems = this.subjects.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
              
              // Cache the response with a timestamp
              this.cacheData(cacheKey, {
                data: response.data,
                pagination: {
                  total: this.subjects.length,
                  page: this.currentPage,
                  pageSize: this.pageSize,
                  totalPages: Math.ceil(this.totalItems / this.pageSize)
                },
                timestamp: Date.now()
              });
            }
          } else if (Array.isArray(response)) {
            // Direct array response
            this.subjects = response;
            this.totalItems = response.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            // Cache the response with a timestamp
            this.cacheData(cacheKey, {
              data: response,
              pagination: {
                total: response.length,
                page: this.currentPage,
                pageSize: this.pageSize,
                totalPages: Math.ceil(this.totalItems / this.pageSize)
              },
              timestamp: Date.now()
            });
          } else if (response.status === 'success' && Array.isArray(response.data)) {
            // Success response format with data array
            this.subjects = response.data;
            
            // Check if pagination is embedded in the response
            if (response.pagination) {
              this.totalItems = response.pagination.totalItems;
              this.totalPages = response.pagination.totalPages;
              this.currentPage = response.pagination.currentPage || this.currentPage;
              
              // Cache the response with a timestamp
              this.cacheData(cacheKey, {
                data: response.data,
                pagination: {
                  total: response.pagination.totalItems,
                  page: response.pagination.currentPage || this.currentPage,
                  pageSize: this.pageSize,
                  totalPages: response.pagination.totalPages
                },
                timestamp: Date.now()
              });
            } else {
              this.totalItems = this.subjects.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
              
              // Cache the response with a timestamp
              this.cacheData(cacheKey, {
                data: response.data,
                pagination: {
                  total: this.subjects.length,
                  page: this.currentPage,
                  pageSize: this.pageSize,
                  totalPages: Math.ceil(this.totalItems / this.pageSize)
                },
                timestamp: Date.now()
              });
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
  
  // Cache-related methods
  private createCacheKey(): string {
    return `page=${this.currentPage}_size=${this.pageSize}_search=${this.searchTerm}_status=${this.selectedStatus}`;
  }
  
  private isCacheValid(cacheEntry: CacheEntry): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheExpiration;
  }
  
  private processCachedData(cacheEntry: CacheEntry): void {
    this.subjects = cacheEntry.data;
    this.filteredSubjects = cacheEntry.data;
    this.totalItems = cacheEntry.pagination.total;
    this.totalPages = cacheEntry.pagination.totalPages;
    this.currentPage = cacheEntry.pagination.page;
  }
  
  private cacheData(key: string, data: CacheEntry): void {
    this.cache[key] = data;
    
    // Store in sessionStorage for persistence
    try {
      sessionStorage.setItem('subjectsCache', JSON.stringify(this.cache));
    } catch (e) {
      console.error('Error saving cache to sessionStorage', e);
      // If we hit storage limits, clear and try again
      sessionStorage.removeItem('subjectsCache');
      this.cleanExpiredCache();
      try {
        sessionStorage.setItem('subjectsCache', JSON.stringify(this.cache));
      } catch (e) {
        console.error('Still cannot save cache, abandoning persistence', e);
      }
    }
  }
  
  private cleanExpiredCache(): void {
    const now = Date.now();
    const newCache: { [key: string]: CacheEntry } = {};
    
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp < this.cacheExpiration) {
        newCache[key] = this.cache[key];
      }
    });
    
    this.cache = newCache;
  }
  
  // Clear cache (call after actions that modify data)
  clearCache(): void {
    this.cache = {};
    sessionStorage.removeItem('subjectsCache');
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
    
    this.confirmationModalService.confirm({
      title: `Confirm ${actionName} subject`,
      message: `Are you sure you want to ${actionName} this subject?`,
      confirmButtonText: 'Yes, ' + actionName,
      cancelButtonText: 'Cancel',
      type: 'warning'
    }).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.subjectService.updateSubjectStatus(subjectId, newStatus).subscribe({
          next: () => {
            // Update the local subject data first for immediate UI update
            const subjectIndex = this.subjects.findIndex(s => s.id === subjectId);
            if (subjectIndex !== -1) {
              this.subjects[subjectIndex].isActive = newStatus;
              
              // Also update in filteredSubjects if it exists
              const filteredIndex = this.filteredSubjects.findIndex(s => s.id === subjectId);
              if (filteredIndex !== -1) {
                this.filteredSubjects[filteredIndex].isActive = newStatus;
              }
            }
            
            this.toastService.showSuccess(`Subject ${actionName}d successfully`);
            // Reload subjects to ensure data consistency
            this.loadSubjects();
          },
          error: (err) => {
            this.toastService.showError(err.error?.message || `Failed to ${actionName} subject`);
            console.error(`Error ${actionName}ing subject:`, err);
          }
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
  
  closeAddSubjectModal(refresh?: boolean): void {
    this.showAddSubjectModal = false;
    
    // If refresh is true, reload the subjects list
    if (refresh) {
      this.clearCache(); // Clear cache for fresh data
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
      this.clearCache(); // Clear cache for fresh data
      this.loadSubjects();
    }
  }
} 