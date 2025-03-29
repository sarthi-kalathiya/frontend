import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../../core/services/user.service';
import { SubjectService } from '../../../../../core/services/subject.service';
import { ToastService } from '../../../../../core/services/toast.service';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  isActive: boolean;
}

@Component({
  selector: 'app-manage-subjects-modal',
  templateUrl: './manage-subjects-modal.component.html',
  styleUrls: ['./manage-subjects-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ManageSubjectsModalComponent implements OnInit {
  @Input() userId!: string;
  @Input() userName: string = '';
  @Input() userRole: string = '';
  @Output() close = new EventEmitter<boolean>();
  
  isLoading = true;
  isSaving = false;
  error = '';
  
  availableSubjects: Subject[] = [];
  assignedSubjects: Subject[] = [];
  originalAssignedSubjectIds: string[] = []; // Track original assigned subjects
  
  // Search and filter
  searchTerm: string = '';
  filteredAvailableSubjects: Subject[] = [];
  
  constructor(
    private userService: UserService,
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    if (!this.userId) {
      this.error = 'User ID is required';
      this.isLoading = false;
      return;
    }
    
    this.loadData();
  }
  
  loadData(): void {
    this.isLoading = true;
    this.error = '';
    
    // First load the user details to get currently assigned subjects
    this.userService.getUserById(this.userId).subscribe({
      next: (userResponse) => {
        if (!userResponse || !userResponse.data) {
          this.handleError({ error: { message: 'Invalid response from server' } }, 'Failed to load user details');
          return;
        }
        
        const userData = userResponse.data;
        this.assignedSubjects = userData.subjects || [];
        
        // Store original assigned subject IDs to know which ones were already assigned
        this.originalAssignedSubjectIds = this.assignedSubjects.map(s => s.id);
        
        // Then load all available subjects
        this.subjectService.getAllSubjects({ includeInactive: false }).subscribe({
          next: (subjectResponse) => {
            if (!subjectResponse || !subjectResponse.data) {
              this.handleError({ error: { message: 'Invalid response from server' } }, 'Failed to load subjects');
              return;
            }
            
            // Get all active subjects
            this.availableSubjects = subjectResponse.data || [];
            
            // Filter out already assigned subjects
            this.filterAvailableSubjects();
            
            this.isLoading = false;
          },
          error: (error) => {
            this.handleError(error, 'Failed to load subjects');
          }
        });
      },
      error: (error) => {
        this.handleError(error, 'Failed to load user details');
      }
    });
  }
  
  filterAvailableSubjects(): void {
    // Get IDs of assigned subjects
    const assignedIds = this.assignedSubjects.map(s => s.id);
    
    // Ensure we have no duplicates in the available subjects array
    const uniqueAvailableSubjects: { [id: string]: Subject } = {};
    this.availableSubjects.forEach(subject => {
      if (!uniqueAvailableSubjects[subject.id]) {
        uniqueAvailableSubjects[subject.id] = subject;
      }
    });
    
    // Convert back to array
    this.availableSubjects = Object.values(uniqueAvailableSubjects);
    
    // Filter available subjects to remove already assigned ones and apply search
    this.filteredAvailableSubjects = this.availableSubjects.filter(subject => 
      !assignedIds.includes(subject.id) && 
      (this.searchTerm === '' || 
        subject.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    
    // Sort available subjects alphabetically by name
    this.filteredAvailableSubjects.sort((a, b) => a.name.localeCompare(b.name));
    
    // Sort assigned subjects alphabetically by name
    this.assignedSubjects.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  onSearch(): void {
    this.filterAvailableSubjects();
  }
  
  // Check if a subject was newly added in this session
  isNewlyAdded(subjectId: string): boolean {
    return !this.originalAssignedSubjectIds.includes(subjectId);
  }
  
  assignSubject(subject: Subject): void {
    // Add subject to assigned list
    this.assignedSubjects.push(subject);
    
    // Remove subject from available subjects to prevent duplicates later
    this.availableSubjects = this.availableSubjects.filter(s => s.id !== subject.id);
    
    // Update filtered subjects
    this.filterAvailableSubjects();
  }
  
  removeSubject(subjectId: string): void {
    // Only allow removing subjects that were newly added (not in original list)
    if (!this.isNewlyAdded(subjectId)) {
      return;
    }
    
    // Find the subject to remove
    const removedSubject = this.assignedSubjects.find(s => s.id === subjectId);
    if (removedSubject) {
      // Remove from assigned subjects
      this.assignedSubjects = this.assignedSubjects.filter(s => s.id !== subjectId);
      
      // Add back to available subjects if not already there
      const alreadyExists = this.availableSubjects.some(s => s.id === subjectId);
      if (!alreadyExists) {
        this.availableSubjects.push(removedSubject);
      }
      
      // Update filtered list
      this.filterAvailableSubjects();
    }
  }
  
  saveChanges(): void {
    if (!this.userId) {
      this.toastService.showError('User ID is required');
      return;
    }
    
    this.isSaving = true;
    this.error = '';
    
    // Get all subject IDs
    const subjectIds = this.assignedSubjects.map(s => s.id);
    
    // Use the SubjectService to assign subjects to the user
    this.subjectService.assignSubjectsToUser(this.userId, subjectIds).subscribe({
      next: (response) => {
        this.toastService.showSuccess(`Successfully updated subject assignments for ${this.userName}`);
        this.isSaving = false;
        this.closeModal(true); // Close with refresh flag
      },
      error: (error) => {
        this.isSaving = false;
        this.handleError(error, 'Failed to update subject assignments');
      }
    });
  }
  
  handleError(error: any, defaultMessage: string): void {
    this.isLoading = false;
    this.isSaving = false;
    console.error(defaultMessage, error);
    this.error = error.error?.message || defaultMessage;
    this.toastService.showError(this.error);
  }
  
  closeModal(refresh = false): void {
    this.close.emit(refresh);
  }
} 