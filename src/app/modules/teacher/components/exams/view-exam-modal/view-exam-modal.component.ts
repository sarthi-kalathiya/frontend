import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService, Exam } from '../../../services/exam.service';

@Component({
  selector: 'app-view-exam-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>View Exam Details</h2>
          <button class="btn-close" (click)="onClose()">×</button>
        </div>
        
        <div class="modal-body" *ngIf="exam">
          <div class="detail-group">
            <label>Name:</label>
            <p>{{ exam.name }}</p>
          </div>
          
          <div class="detail-group">
            <label>Subject:</label>
            <p>{{ exam.subject.name }} ({{ exam.subject.code }})</p>
          </div>
          
          <div class="detail-group">
            <label>Questions:</label>
            <p>{{ exam.currentQuestionCount }} / {{ exam.numQuestions }}</p>
          </div>
          
          <div class="detail-group">
            <label>Marks:</label>
            <p>Passing: {{ exam.passingMarks }} / Total: {{ exam.totalMarks }}</p>
          </div>
          
          <div class="detail-group">
            <label>Duration:</label>
            <p>{{ exam.duration }} hours</p>
          </div>
          
          <div class="detail-group">
            <label>Start Date:</label>
            <p>{{ exam.startDate | date:'medium' }}</p>
          </div>
          
          <div class="detail-group">
            <label>End Date:</label>
            <p>{{ exam.endDate | date:'medium' }}</p>
          </div>
          
          <div class="detail-group">
            <label>Status:</label>
            <p>{{ exam.isActive ? 'Active' : 'Draft' }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="onClose()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background-color: white;
      border-radius: 4px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .btn-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        color: #666;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .modal-body {
      padding: 16px;
      
      .detail-group {
        margin-bottom: 16px;
        
        label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }
        
        p {
          margin: 0;
          color: #333;
        }
      }
    }
    
    .modal-footer {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      
      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        
        &.btn-primary {
          background-color: #000;
          color: white;
          border: none;
          
          &:hover {
            background-color: #333;
          }
        }
      }
    }
  `]
})
export class ViewExamModalComponent implements OnInit {
  @Input() examId!: string;
  @Output() close = new EventEmitter<void>();
  
  exam: Exam | null = null;
  
  constructor(private examService: ExamService) {}
  
  ngOnInit(): void {
    if (this.examId) {
      this.loadExam();
    }
  }
  
  loadExam(): void {
    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        this.exam = exam;
      },
      error: (error) => {
        console.error('Failed to load exam:', error);
      }
    });
  }
  
  onClose(): void {
    this.close.emit();
  }
} 