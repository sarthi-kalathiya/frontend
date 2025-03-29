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
  
  // Search and filter
  searchTerm: string = '';
  filteredAvailableSubjects: Subject[] = [];
  
  constructor(
    private userService: UserService,
    private subjectService: SubjectService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.isLoading = true;
    this.error = '';
    
    // First load the user details to get currently assigned subjects
    this.userService.getUserById(this.userId).subscribe({
      next: (userResponse) => {
        const userData = userResponse.data;
        this.assignedSubjects = userData.subjects || [];
        
        // Then load all available subjects
        this.subjectService.getAllSubjects({ includeInactive: false }).subscribe({
          next: (subjectResponse) => {
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
    // Remove already assigned subjects from available subjects
    const assignedIds = this.assignedSubjects.map(s => s.id);
    
    // Filter available subjects to remove already assigned ones
    this.filteredAvailableSubjects = this.availableSubjects.filter(subject => 
      !assignedIds.includes(subject.id) && 
      (this.searchTerm === '' || 
        subject.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }
  
  onSearch(): void {
    this.filterAvailableSubjects();
  }
  
  assignSubject(subject: Subject): void {
    // Move subject from available to assigned
    this.assignedSubjects.push(subject);
    this.filterAvailableSubjects();
  }
  
  removeSubject(subjectId: string): void {
    // Move subject from assigned back to available
    const removedSubject = this.assignedSubjects.find(s => s.id === subjectId);
    if (removedSubject) {
      this.assignedSubjects = this.assignedSubjects.filter(s => s.id !== subjectId);
      this.availableSubjects.push(removedSubject);
      this.filterAvailableSubjects();
    }
  }
  
  saveChanges(): void {
    this.isSaving = true;
    
    // Get all subject IDs
    const subjectIds = this.assignedSubjects.map(s => s.id);
    
    // Use the SubjectService instead of UserService for consistent API structure
    this.subjectService.assignSubjectsToUser(this.userId, subjectIds).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Subject assignments updated successfully');
        this.isSaving = false;
        this.closeModal(true); // Close with refresh flag
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.showError(error.error?.message || 'Failed to update subject assignments');
      }
    });
  }
  
  handleError(error: any, defaultMessage: string): void {
    this.isLoading = false;
    this.error = error.error?.message || defaultMessage;
    this.toastService.showError(this.error);
  }
  
  closeModal(refresh = false): void {
    this.close.emit(refresh);
  }
} 