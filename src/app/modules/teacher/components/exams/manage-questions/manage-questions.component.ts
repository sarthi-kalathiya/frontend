import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../../services/exam.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ToastService } from '@app/core/services/toast.service';

// Required for Bootstrap dropdown functionality
declare var bootstrap: any;

interface Question {
  id: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

@Component({
  selector: 'app-manage-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule
  ],
  templateUrl: './manage-questions.component.html',
  styleUrls: ['./manage-questions.component.scss']
})
export class ManageQuestionsComponent implements OnInit, AfterViewInit {
  examId: string = '';
  sessionName: string = '';
  questions: Question[] = [];
  loading: boolean = false;
  searchQuery: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private toastService: ToastService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.examId) {
      this.router.navigate(['/teacher/exams']);
      return;
    }
    
    this.loadExamDetails();
    this.loadQuestions();
  }
  
  ngAfterViewInit(): void {
    // Initialize Bootstrap dropdowns
    this.initDropdowns();
  }
  
  private initDropdowns(): void {
    const dropdownElementList = this.elementRef.nativeElement.querySelectorAll('[data-bs-toggle="dropdown"]');
    if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
      dropdownElementList.forEach((element: any) => {
        new bootstrap.Dropdown(element);
      });
    }
  }

  loadExamDetails(): void {
    this.loading = true;
    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        this.sessionName = exam.name;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Failed to load exam details');
        this.loading = false;
      }
    });
  }

  loadQuestions(): void {
    this.loading = true;
    this.examService.getExamQuestions(this.examId).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.loading = false;
        
        // Re-initialize dropdowns after data is loaded
        setTimeout(() => this.initDropdowns(), 0);
      },
      error: (error) => {
        this.toastService.showError('Failed to load questions');
        this.loading = false;
      }
    });
  }

  onDragDrop(event: CdkDragDrop<Question[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    
    // Get array of question IDs in new order
    const questionIds = this.questions.map(q => q.id);
    
    // Call backend to save the new order
    this.examService.reorderQuestions(this.examId, questionIds).subscribe({
      next: () => {
        this.toastService.showSuccess('Questions reordered successfully');
      },
      error: (error) => {
        this.toastService.showError('Failed to reorder questions');
        // Reload questions to restore original order
        this.loadQuestions();
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/teacher/exams', this.examId]);
  }

  addQuestion(): void {
    // Navigate to add question page or open modal
    this.router.navigate(['/teacher/exams', this.examId, 'add-question']);
  }

  editQuestion(questionId: string): void {
    // Navigate to edit question page or open modal
    this.router.navigate(['/teacher/exams', this.examId, 'edit-question', questionId]);
  }

  deleteQuestion(questionId: string): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.examService.deleteQuestion(this.examId, questionId).subscribe({
        next: () => {
          this.toastService.showSuccess('Question deleted successfully');
          this.loadQuestions();
        },
        error: (error) => {
          this.toastService.showError('Failed to delete question');
        }
      });
    }
  }

  get filteredQuestions(): Question[] {
    if (!this.searchQuery.trim()) {
      return this.questions;
    }
    
    const searchTerm = this.searchQuery.toLowerCase().trim();
    return this.questions.filter(q => 
      q.questionText.toLowerCase().includes(searchTerm)
    );
  }
} 