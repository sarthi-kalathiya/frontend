import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ExamService } from '../../../services/exam.service';
import { ToastService } from '@app/core/services/toast.service';
import { finalize } from 'rxjs/operators';

interface Question {
  id: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: any[];
}

interface CreateQuestionDto {
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

@Component({
  selector: 'app-edit-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './edit-question.component.html',
  styleUrls: ['./edit-question.component.scss'],
})
export class EditQuestionComponent implements OnInit {
  @Input() examId!: string;
  @Input() questionId: string = '';
  @Output() close = new EventEmitter<boolean>();

  questionForm!: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  readonly MAX_OPTIONS = 4; // Maximum number of options allowed
  readonly MIN_OPTIONS = 2; // Minimum number of options required
  correctOptionIndex: number = 0; // Track the currently selected correct option
  
  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  get canAddOption(): boolean {
    return this.options.length < this.MAX_OPTIONS;
  }

  get canRemoveOption(): boolean {
    return this.options.length > this.MIN_OPTIONS;
  }

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private toastService: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.questionId) {
      this.loadQuestion();
    }
  }

  initForm(): void {
    this.questionForm = this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
      marks: [1, [Validators.required, Validators.min(0.5)]],
      negativeMarks: [0, [Validators.required, Validators.min(0)]],
      options: this.fb.array([])
    });

    // Initialize with two empty options
    this.addOption();
    this.addOption();
  }

  loadQuestion(): void {
    if (!this.examId || !this.questionId) return;

    this.loading = true;
    this.error = null;

    this.examService.getExamQuestions(this.examId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (questions: Question[]) => {
          const question = questions.find(q => q.id === this.questionId);
          if (question) {
            this.populateForm(question);
          } else {
            this.error = 'Question not found';
          }
        },
        error: (err) => {
          console.error('Error loading question:', err);
          this.error = err.error?.message || 'Failed to load question data';
        }
      });
  }

  populateForm(question: Question): void {
    // Clear existing options
    while (this.options.length) {
      this.options.removeAt(0);
    }

    // Update form values
    this.questionForm.patchValue({
      questionText: question.questionText,
      marks: question.marks,
      negativeMarks: question.negativeMarks
    });

    // Add options (up to MAX_OPTIONS)
    const optionsToAdd = question.options.slice(0, this.MAX_OPTIONS);
    let correctIndex = -1;
    
    optionsToAdd.forEach((option, index) => {
      if (option.isCorrect) {
        correctIndex = index;
      }
      
      this.options.push(
        this.fb.group({
          optionText: [option.optionText, Validators.required]
        })
      );
    });

    // Set the correct option index
    this.correctOptionIndex = correctIndex >= 0 ? correctIndex : 0;

    // Ensure we have at least MIN_OPTIONS
    while (this.options.length < this.MIN_OPTIONS) {
      this.addOption();
    }
  }

  addOption(): void {
    if (this.options.length >= this.MAX_OPTIONS) return;
    
    this.options.push(
      this.fb.group({
        optionText: ['', Validators.required]
      })
    );
  }

  removeOption(index: number): void {
    if (this.options.length <= this.MIN_OPTIONS) return;
    
    // If removing the correct option, reset to first option
    if (index === this.correctOptionIndex) {
      this.correctOptionIndex = 0;
    } 
    // If removing an option before the correct one, adjust the index
    else if (index < this.correctOptionIndex) {
      this.correctOptionIndex--;
    }
    
    this.options.removeAt(index);
  }

  setCorrectOption(index: number): void {
    // Prevent event propagation in case this is called from a nested element
    this.correctOptionIndex = index;
    
    // Apply a focus effect to highlight the selection
    const inputElement = document.getElementById(`optionText-${index}`) as HTMLInputElement;
    if (inputElement) {
      // Add a small visual delay for better user feedback
      setTimeout(() => {
        inputElement.focus();
      }, 100);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // 'A', 'B', 'C', etc.
  }

  isInvalid(controlName: string): boolean {
    const control = this.questionForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  isOptionInvalid(index: number, controlName: string): boolean {
    const control = this.options.at(index).get(controlName);
    return !!control && control.invalid && control.touched;
  }

  hasCorrectOption(): boolean {
    // Always true now since we're using radio buttons and one must be selected
    return this.correctOptionIndex >= 0 && this.correctOptionIndex < this.options.length;
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.questionForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const questionData: CreateQuestionDto = {
      questionText: this.questionForm.value.questionText,
      marks: this.questionForm.value.marks,
      negativeMarks: this.questionForm.value.negativeMarks,
      options: this.questionForm.value.options.map((opt: any, index: number) => ({
        text: opt.optionText,
        isCorrect: index === this.correctOptionIndex
      }))
    };

    const request = this.questionId
      ? this.examService.updateQuestion(this.examId, this.questionId, questionData)
      : this.examService.addQuestion(this.examId, questionData);

    request
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.questionId ? 'Question updated successfully' : 'Question added successfully'
          );
          this.close.emit(true);
        },
        error: (err) => {
          console.error('Error saving question:', err);
          this.error = err.error?.message || 'Failed to save question. Please try again.';
        }
      });
  }

  onClose(): void {
    this.close.emit(false);
  }
} 