import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../../../core/services/subject.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AddSubjectModalComponent } from './add-subject-modal/add-subject-modal.component';
import { ViewSubjectModalComponent } from './view-subject-modal/view-subject-modal.component';
import { EditSubjectModalComponent } from './edit-subject-modal/edit-subject-modal.component';

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
    EditSubjectModalComponent
  ]
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  searchTerm: string = '';
  selectedStatus: string = 'All Statuses';
  activeActionMenu: string | null = null;
  showStatusDropdown: boolean = false;
  showAddSubjectModal: boolean = false;
  showViewSubjectModal: boolean = false;
  showEditSubjectModal: boolean = false;
  selectedSubject: Subject | null = null;
  isLoading: boolean = false;
  error: string = '';
  flipUpMenuIds: Set<string> = new Set();
  
  constructor(
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}
  
  @HostListener('document:click')
  closeDropdowns() {
    this.activeActionMenu = null;
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
    
    if (this.selectedStatus !== 'All Statuses') {
      filters.status = this.selectedStatus.toLowerCase();
    }
    
    this.subjectService.getSubjects(filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.subjects = response.data || [];
        this.applyFilters(); // Apply client-side filtering for any additional filtering
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to load subjects';
        console.error('Error loading subjects:', err);
        
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
  
  onStatusChange(): void {
    // For server-side filtering, reload subjects
    this.loadSubjects();
  }
  
  toggleActionMenu(subjectId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.activeActionMenu = this.activeActionMenu === subjectId ? null : subjectId;
    
    // Check if we need to flip the menu up (if item is near the bottom of the table)
    if (this.activeActionMenu && event) {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      // Get position of the clicked button
      const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
      // Calculate if the menu would go off screen (assuming menu height ~120px)
      const estimatedMenuHeight = 120; 
      
      this.flipUpMenuIds.clear();
      if (buttonRect.bottom + estimatedMenuHeight > viewportHeight) {
        this.flipUpMenuIds.add(subjectId);
      }
    }
  }
  
  editSubject(subjectId: string, event: MouseEvent): void {
    event.stopPropagation();
    const subject = this.subjects.find(s => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showEditSubjectModal = true;
    }
    this.activeActionMenu = null;
  }
  
  viewSubject(subjectId: string, event: MouseEvent): void {
    event.stopPropagation();
    const subject = this.subjects.find(s => s.id === subjectId);
    if (subject) {
      this.selectedSubject = subject;
      this.showViewSubjectModal = true;
    }
    this.activeActionMenu = null;
  }
  
  deleteSubject(subjectId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this subject?')) {
      this.subjectService.deleteSubject(subjectId).subscribe({
        next: () => {
          this.toastService.showSuccess('Subject deleted successfully');
          // Reload subjects
          this.loadSubjects();
        },
        error: (err) => {
          this.toastService.showError(err.error?.message || 'Failed to delete subject');
          console.error('Error deleting subject:', err);
        }
      });
    }
    
    this.activeActionMenu = null;
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
  
  toggleSubjectStatus(subjectId: string, event: MouseEvent): void {
    event.stopPropagation();
    
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
    
    this.activeActionMenu = null;
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