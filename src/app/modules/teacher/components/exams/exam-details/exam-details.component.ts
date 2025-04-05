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
  selectedStatus: string = 'Upcoming';
  
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
          this.selectedStatus = this.getStatusText(this.exam);
        },
        error: (error: any) => {
          console.error('Failed to load exam details:', error);
          this.error = error.error?.message || 'Failed to load exam details. Please try again.';
        }
      });
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
    
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (now < startDate) {
      return 'Upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'In Progress';
    } else {
      return 'Completed';
    }
  }

  updateExamStatus(status: string): void {
    // In a real implementation, this would make an API call to update the exam status
    const isActive = status !== 'Draft';
    
    this.examService.updateExamStatus(this.examId, isActive)
      .subscribe({
        next: () => {
          this.toastService.showSuccess(`Exam status updated to ${status}`);
          this.loadExamDetails();
        },
        error: (error) => {
          console.error('Error updating exam status:', error);
          this.toastService.showError(error.error?.message || 'Failed to update exam status');
        }
      });
  }
} 