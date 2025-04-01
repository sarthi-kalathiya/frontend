import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExamService } from '../../../services/exam.service';

@Component({
  selector: 'app-add-exam-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create New Exam</h2>
          <button class="btn-close" (click)="onClose()">×</button>
        </div>
        
        <div class="modal-body">
          <form [formGroup]="examForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="name">Exam Name</label>
              <input type="text" id="name" formControlName="name" class="form-control">
              <div class="error-message" *ngIf="examForm.get('name')?.errors?.['required'] && examForm.get('name')?.touched">
                Name is required
              </div>
            </div>

            <div class="form-group">
              <label for="subjectId">Subject</label>
              <select id="subjectId" formControlName="subjectId" class="form-control">
                <option value="">Select a subject</option>
                <!-- TODO: Add subject options -->
              </select>
              <div class="error-message" *ngIf="examForm.get('subjectId')?.errors?.['required'] && examForm.get('subjectId')?.touched">
                Subject is required
              </div>
            </div>

            <div class="form-group">
              <label for="numQuestions">Number of Questions</label>
              <input type="number" id="numQuestions" formControlName="numQuestions" class="form-control">
              <div class="error-message" *ngIf="examForm.get('numQuestions')?.errors?.['required'] && examForm.get('numQuestions')?.touched">
                Number of questions is required
              </div>
            </div>

            <div class="form-group">
              <label for="passingMarks">Passing Marks</label>
              <input type="number" id="passingMarks" formControlName="passingMarks" class="form-control">
              <div class="error-message" *ngIf="examForm.get('passingMarks')?.errors?.['required'] && examForm.get('passingMarks')?.touched">
                Passing marks is required
              </div>
            </div>

            <div class="form-group">
              <label for="totalMarks">Total Marks</label>
              <input type="number" id="totalMarks" formControlName="totalMarks" class="form-control">
              <div class="error-message" *ngIf="examForm.get('totalMarks')?.errors?.['required'] && examForm.get('totalMarks')?.touched">
                Total marks is required
              </div>
            </div>

            <div class="form-group">
              <label for="duration">Duration (hours)</label>
              <input type="number" id="duration" formControlName="duration" class="form-control">
              <div class="error-message" *ngIf="examForm.get('duration')?.errors?.['required'] && examForm.get('duration')?.touched">
                Duration is required
              </div>
            </div>

            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="datetime-local" id="startDate" formControlName="startDate" class="form-control">
              <div class="error-message" *ngIf="examForm.get('startDate')?.errors?.['required'] && examForm.get('startDate')?.touched">
                Start date is required
              </div>
            </div>

            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="datetime-local" id="endDate" formControlName="endDate" class="form-control">
              <div class="error-message" *ngIf="examForm.get('endDate')?.errors?.['required'] && examForm.get('endDate')?.touched">
                End date is required
              </div>
            </div>

            <div class="form-group">
              <label for="isActive">Status</label>
              <select id="isActive" formControlName="isActive" class="form-control">
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Draft</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="onClose()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="examForm.invalid">Create Exam</button>
            </div>
          </form>
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
      
      .form-group {
        margin-bottom: 16px;
        
        label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }
        
        .form-control {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          
          &:focus {
            outline: none;
            border-color: #000;
          }
        }
        
        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
        }
      }
    }
    
    .modal-footer {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      
      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        
        &.btn-primary {
          background-color: #000;
          color: white;
          border: none;
          
          &:hover:not(:disabled) {
            background-color: #333;
          }
          
          &:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
        }
        
        &.btn-secondary {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
          
          &:hover {
            background-color: #e9ecef;
          }
        }
      }
    }
  `]
})
export class AddExamModalComponent {
  @Output() close = new EventEmitter<boolean>();
  
  examForm: FormGroup;
  
  constructor(
    private examService: ExamService,
    private fb: FormBuilder
  ) {
    this.examForm = this.fb.group({
      name: ['', Validators.required],
      subjectId: ['', Validators.required],
      numQuestions: ['', [Validators.required, Validators.min(1)]],
      passingMarks: ['', [Validators.required, Validators.min(0)]],
      totalMarks: ['', [Validators.required, Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true]
    });
  }
  
  onSubmit(): void {
    if (this.examForm.valid) {
      const examData = {
        ...this.examForm.value,
        startDate: new Date(this.examForm.value.startDate).toISOString(),
        endDate: new Date(this.examForm.value.endDate).toISOString()
      };
      
      this.examService.createExam(examData).subscribe({
        next: () => {
          this.close.emit(true);
        },
        error: (error) => {
          console.error('Failed to create exam:', error);
        }
      });
    }
  }
  
  onClose(): void {
    this.close.emit(false);
  }
}