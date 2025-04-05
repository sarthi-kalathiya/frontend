import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../../services/exam.service';
import { ToastService } from '@app/core/services/toast.service';
import { finalize } from 'rxjs/operators';
import { EditExamModalComponent } from '../edit-exam-modal/edit-exam-modal.component';

@Component({
  selector: 'app-exam-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EditExamModalComponent
  ],
  templateUrl: './exam-details.component.html',
  styleUrls: ['./exam-details.component.scss'],
})
export class ExamDetailsComponent implements OnInit {
  examId: string = '';
  exam: any = null;
  isLoading: boolean = true;
  error: string | null = null;
  activeTab: 'overview' | 'students' | 'questions' = 'overview';
  showEditModal: boolean = false;
  selectedStatus: string = 'Draft';
  previousStatus: string = 'Draft';
  
  // Define settable statuses
  readonly SETTABLE_STATUSES = ['Draft', 'Active'];
  
  // New properties for students and questions tabs
  studentsAssigned: number = 45; // Placeholder
  studentsCompleted: number = 0; // Placeholder
  studentsPending: number = 45; // Placeholder
  studentsBanned: number = 0; // Placeholder

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.examId) {
      this.error = 'Invalid exam ID';
      this.isLoading = false;
      return;
    }
    
    this.loadExamDetails();
  }

  loadExamDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.examService.getExamById(this.examId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          this.exam = response;
          // Use statusText from API if available, otherwise calculate it
          this.selectedStatus = response.statusText || this.getStatusText(this.exam);
          this.previousStatus = this.selectedStatus;
        },
        error: (error: any) => {
          console.error('Failed to load exam details:', error);
          this.error = error.error?.message || 'Failed to load exam details. Please try again.';
        }
      });
  }

  // Helper method to check if status can be changed
  canChangeStatus(status: string): boolean {
    // Draft can always be changed to Active
    if (status === 'Draft') return true;
    
    // Upcoming can be changed to Draft (but not Active to Draft)
    if (status === 'Upcoming') return true;
    
    // Active can't be changed back to Draft once students might have started
    if (status === 'Active') return true;
    
    // Finished exams can't be changed
    return false;
  }
  
  // Get available status options based on current status
  getAvailableStatusOptions(): string[] {
    switch (this.selectedStatus) {
      case 'Draft':
        return ['Draft', 'Active'];
      case 'Upcoming':
        return ['Draft', 'Active'];
      case 'Active':
        return ['Active']; // Can't go back to Draft
      case 'Finished':
        return []; // No options for finished exams
      default:
        return ['Draft', 'Active'];
    }
  }

  navigateBack(): void {
    this.router.navigate(['/teacher/exams']);
  }

  setActiveTab(tab: 'overview' | 'students' | 'questions'): void {
    this.activeTab = tab;
  }

  openEditExamModal(): void {
    this.showEditModal = true;
  }

  closeEditExamModal(refresh: boolean = false): void {
    this.showEditModal = false;
    if (refresh) {
      this.loadExamDetails();
    }
  }

  navigateToManageQuestions(): void {
    // Temporarily show a toast until the questions component is implemented
    this.toastService.showInfo('Questions management will be implemented soon');
    // this.router.navigate(['/teacher/exams', this.examId, 'questions']);
  }

  navigateToManageStudents(): void {
    // Temporarily show a toast until the students component is implemented
    this.toastService.showInfo('Student management will be implemented soon');
    // this.router.navigate(['/teacher/exams', this.examId, 'students']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusText(exam: any): string {
    if (!exam) return 'Unknown';
    
    // If exam is inactive, always show "Draft" status
    if (!exam.isActive) {
      return 'Draft';
    }
    
    // If exam is active, determine status based on dates
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (now < startDate) {
      return 'Upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'Active';
    } else {
      return 'Finished';
    }
  }

  updateExamStatus(status: string): void {
    // Check if the selected status is valid for the current status
    if (!this.getAvailableStatusOptions().includes(status)) {
      this.toastService.showError(`Cannot change exam from ${this.previousStatus} to ${status}`);
      this.selectedStatus = this.previousStatus;
      return;
    }
    
    // Only update if status actually changed
    if (status === this.previousStatus) {
      return;
    }
    
    // Set isActive based on status
    const isActive = status !== 'Draft';
    
    this.examService.updateExamStatus(this.examId, isActive)
      .subscribe({
        next: () => {
          this.toastService.showSuccess(`Exam status updated to ${status}`);
          this.previousStatus = status;
          this.loadExamDetails();
        },
        error: (error) => {
          console.error('Error updating exam status:', error);
          this.toastService.showError(error.error?.message || 'Failed to update exam status');
          
          // Revert the dropdown to the previous status
          this.selectedStatus = this.previousStatus;
        }
      });
  }
} 