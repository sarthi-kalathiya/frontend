import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ExamService } from '../../../services/exam.service';
import { SubjectService } from '@app/core/services/subject.service';
import { ToastService } from '@app/core/services/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-edit-exam-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-exam-modal.component.html',
  styleUrls: ['./edit-exam-modal.component.scss'],
})
export class EditExamModalComponent implements OnInit {
  @Input() examId!: string;
  @Output() close = new EventEmitter<boolean>();
  
  examForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  subjects: any[] = [];
  isLoadingSubjects = false;
  errorMessage: string | null = null;
  examData: any = null;

  constructor(
    private examService: ExamService,
    private subjectService: SubjectService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.examForm = this.fb.group({
      name: ['', [Validators.required]],
      subjectId: ['', [Validators.required]],
      numQuestions: ['', [Validators.required, Validators.min(1)]],
      totalMarks: ['', [Validators.required, Validators.min(1)]],
      passingMarks: ['', [Validators.required, Validators.min(1)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadSubjects();
    this.loadExamData();
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
          this.errorMessage = 'Failed to load subjects. Please try again.';
        }
      });
  }

  loadExamData(): void {
    if (!this.examId) {
      this.errorMessage = 'Invalid exam ID.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.examService.getExamById(this.examId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.examData = response;
            this.populateForm();
          } else {
            this.errorMessage = 'Failed to load exam details: Empty response';
            console.error('Empty response received from getExamById');
          }
        },
        error: (error: any) => {
          console.error('Failed to load exam details:', error);
          if (error.status === 404) {
            this.errorMessage = 'Exam not found. It may have been deleted.';
          } else if (error.status === 403) {
            this.errorMessage = 'You do not have permission to access this exam.';
          } else {
            this.errorMessage = error.error?.message || 
              `Failed to load exam details (${error.status || 'unknown error'}). Please try again.`;
          }
        }
      });
  }

  populateForm(): void {
    if (!this.examData) return;

    // Format dates as local datetime strings for the input
    const startDate = this.formatDateForInput(this.examData.startDate);
    const endDate = this.formatDateForInput(this.examData.endDate);

    this.examForm.patchValue({
      name: this.examData.name,
      subjectId: this.examData.subject?.id || this.examData.subjectId,
      numQuestions: this.examData.numQuestions || this.examData.currentQuestionCount,
      totalMarks: this.examData.totalMarks,
      passingMarks: this.examData.passingMarks,
      duration: this.examData.duration,
      startDate: startDate,
      endDate: endDate
    });
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  }

  onSubmit(): void {
    if (this.examForm.invalid) {
      this.markFormGroupTouched(this.examForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const examData = {
      ...this.examForm.value,
      // Format dates if needed
      startDate: this.formatDate(this.examForm.value.startDate),
      endDate: this.formatDate(this.examForm.value.endDate),
    };

    this.examService.updateExam(this.examId, examData)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Exam updated successfully');
          this.close.emit(true);
        },
        error: (error) => {
          console.error('Error updating exam:', error);
          this.errorMessage = error.error?.message || 'Failed to update exam. Please try again.';
        }
      });
  }

  private formatDate(date: string): string {
    if (!date) return '';
    // If date is already in ISO format, return it
    if (date.includes('T')) return date;
    
    // Otherwise create a date object and format it
    return new Date(date).toISOString();
  }

  // Helper method to mark all controls as touched to trigger validation
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClose(): void {
    this.close.emit(false);
  }
}
