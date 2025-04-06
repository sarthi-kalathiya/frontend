import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../../services/exam.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ToastService } from '@app/core/services/toast.service';
import { EditQuestionComponent } from '../edit-question/edit-question.component';
import { ActionMenuComponent, ActionMenuItem } from '@app/shared/components/action-menu/action-menu.component';

// Required for Bootstrap dropdown functionality
declare var bootstrap: any;

interface QuestionData {
  id: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  correctOptionId: string;
  position: number;
  options: OptionData[];
}

interface OptionData {
  id: string;
  optionText: string;
}

interface Question {
  id: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  correctOptionId: string;
  position: number;
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
    DragDropModule,
    EditQuestionComponent,
    ActionMenuComponent
  ],
  templateUrl: './manage-questions.component.html',
  styleUrls: ['./manage-questions.component.scss']
})
export class ManageQuestionsComponent implements OnInit, AfterViewInit {
  examId: string = '';
  sessionName: string = '';
  questions: Question[] = [];
  loading: boolean = true;
  searchQuery: string = '';
  
  // State for edit-question modal
  showQuestionModal = false;
  selectedQuestionId: string = '';

  // Action menu items
  questionActions: ActionMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'bi-pencil',
      action: 'edit'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'bi-trash',
      action: 'delete'
    }
  ];

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
      next: (exam: any) => {
        // Check if the response has a data property (API response format)
        const examData = exam.data ? exam.data : exam;
        
        this.sessionName = examData.name;
        
        // Process questions from the exam details
        if (examData.questions && Array.isArray(examData.questions)) {
          this.questions = examData.questions.map((q: QuestionData) => {
            // Add isCorrect property to each option
            const questionWithCorrectOptions = {
              ...q,
              options: q.options.map((opt: OptionData) => ({
                ...opt,
                isCorrect: opt.id === q.correctOptionId
              }))
            };
            return questionWithCorrectOptions;
          });
          
          // Sort by position if available
          this.questions.sort((a, b) => {
            // If position exists and is different, sort by position
            if (a.position !== undefined && b.position !== undefined && a.position !== b.position) {
              return a.position - b.position;
            }
            // Otherwise, don't change order
            return 0;
          });
        }
        
        this.loading = false;
        
        // Re-initialize dropdowns after data is loaded
        setTimeout(() => this.initDropdowns(), 0);
      },
      error: (error) => {
        this.toastService.showError('Failed to load exam details');
        this.loading = false;
      }
    });
  }

  handleQuestionAction(event: { action: string; id: string }): void {
    switch (event.action) {
      case 'edit':
        this.editQuestion(event.id);
        break;
      case 'delete':
        this.deleteQuestion(event.id);
        break;
      default:
        console.error('Unknown action:', event.action);
    }
  }

  onDragDrop(event: CdkDragDrop<Question[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    
    // Update position values
    this.questions.forEach((question, index) => {
      question.position = index;
    });
    
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
        this.loadExamDetails();
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/teacher/exams', this.examId]);
  }

  addQuestion(): void {
    // Show modal with no questionId (for adding)
    this.selectedQuestionId = '';
    this.showQuestionModal = true;
  }

  editQuestion(questionId: string): void {
    // Show modal with the questionId (for editing)
    this.selectedQuestionId = questionId;
    this.showQuestionModal = true;
  }

  onQuestionModalClose(saved: boolean): void {
    this.showQuestionModal = false;
    
    // Reload questions if changes were saved
    if (saved) {
      this.loadExamDetails();
    }
  }

  deleteQuestion(questionId: string): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.examService.deleteQuestion(this.examId, questionId).subscribe({
        next: () => {
          this.toastService.showSuccess('Question deleted successfully');
          this.loadExamDetails();
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