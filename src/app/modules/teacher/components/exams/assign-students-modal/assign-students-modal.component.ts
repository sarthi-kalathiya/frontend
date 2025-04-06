import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../../services/exam.service';
import { TeacherExamService } from '../../../services/teacher-exam.service';
import { ToastService } from '@app/core/services/toast.service';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-assign-students-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './assign-students-modal.component.html',
  styleUrls: ['./assign-students-modal.component.scss']
})
export class AssignStudentsModalComponent implements OnInit {
  @Input() examId!: string;
  @Output() close = new EventEmitter<boolean>();

  // States
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string | null = null;
  searchQuery: string = '';
  
  // Data
  examName: string = '';
  subjectName: string = '';
  subjectId: string = '';
  allStudents: any[] = [];
  filteredStudents: any[] = [];
  selectedStudentIds: string[] = [];
  
  constructor(
    private examService: ExamService,
    private teacherExamService: TeacherExamService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Get eligible students for the exam
    this.teacherExamService.getEligibleStudents(this.examId)
      .pipe(
        catchError(error => {
          this.errorMessage = error.error?.message || 'Failed to load students. Please try again.';
          console.error('Error loading students:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('API response:', response);
          
          // Extract data from the response structure
          const result = response.data || response;
          
          this.examName = result.examName;
          this.subjectName = result.subjectName;
          this.allStudents = result.eligibleStudents || [];
          
          console.log('Loaded students:', this.allStudents);
          this.applySearch();
        }
      });
  }

  applySearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredStudents = [...this.allStudents];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredStudents = this.allStudents.filter(student => 
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.rollNumber.toLowerCase().includes(query)
    );
  }

  toggleStudentSelection(studentId: string): void {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedStudentIds.push(studentId);
    } else {
      this.selectedStudentIds.splice(index, 1);
    }
  }

  isSelected(studentId: string): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  selectAll(): void {
    if (this.selectedStudentIds.length === this.filteredStudents.length) {
      // If all are selected, deselect all
      this.selectedStudentIds = [];
    } else {
      // Otherwise, select all
      this.selectedStudentIds = this.filteredStudents.map(student => student.id);
    }
  }

  onSave(): void {
    if (this.selectedStudentIds.length === 0) {
      this.toastService.showInfo('Please select at least one student to assign');
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    this.teacherExamService.assignExamToStudents(this.examId, this.selectedStudentIds)
      .pipe(
        catchError(error => {
          this.errorMessage = error.error?.message || 'Failed to assign students. Please try again.';
          console.error('Error assigning students:', error);
          return of(null);
        }),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe(result => {
        if (result) {
          this.toastService.showSuccess(`Successfully assigned ${this.selectedStudentIds.length} students to the exam`);
          this.close.emit(true); // Close with success
        }
      });
  }

  onClose(): void {
    this.close.emit(false);
  }
} 