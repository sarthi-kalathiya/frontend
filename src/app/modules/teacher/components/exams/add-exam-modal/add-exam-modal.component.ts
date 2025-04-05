import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  selector: 'app-add-exam-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-exam-modal.component.html',
  styleUrls: ['./add-exam-modal.component.scss'],
})
export class AddExamModalComponent implements OnInit {
  @Output() close = new EventEmitter<boolean>();
  
  examForm: FormGroup;
  isSubmitting = false;
  subjects: any[] = [];
  isLoadingSubjects = false;
  errorMessage: string | null = null;

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

    this.examService.createExam(examData)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Exam created successfully');
          this.close.emit(true);
        },
        error: (error) => {
          console.error('Error creating exam:', error);
          this.errorMessage = error.error?.message || 'Failed to create exam. Please try again.';
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
