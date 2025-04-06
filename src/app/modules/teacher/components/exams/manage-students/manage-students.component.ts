import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../../services/exam.service';
import { TeacherExamService, StudentFilterOptions, FilteredStudentsResponse, StudentStatistics } from '../../../services/teacher-exam.service';
import { ToastService } from '@app/core/services/toast.service';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { environment } from '@environments/environment';
import { ActionMenuComponent, ActionMenuItem } from '@app/shared/components/action-menu/action-menu.component';
import { AssignStudentsModalComponent } from '../assign-students-modal/assign-students-modal.component';

@Component({
  selector: 'app-manage-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ActionMenuComponent,
    AssignStudentsModalComponent
  ],
  templateUrl: './manage-students.component.html',
  styleUrls: ['./manage-students.component.scss']
})
export class ManageStudentsComponent implements OnInit {
  // Make Math available to the template
  Math = Math;

  examId: string = '';
  examName: string = 'Sessional 1';
  subjectName: string = 'Discrete Mathematics';
  isLoading: boolean = true;
  tableLoading: boolean = false;
  error: string | null = null;
  searchQuery: string = '';
  activeFilter: 'All' | 'Completed' | 'In Progress' | 'Not Started' | 'Banned' = 'All';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Dropdown state
  showStatusDropdown: boolean = false;
  
  // Search debounce
  private searchSubject = new Subject<string>();

  // Student statistics
  totalStudents: number = 0;
  completedCount: number = 0;
  inProgressCount: number = 0;
  notStartedCount: number = 0;
  bannedCount: number = 0;
  
  // Exam statistics
  averageScore: number = 0;
  passRate: number = 0;
  passCount: number = 0;
  
  // Students list
  students: any[] = [];

  // Modal state
  showAssignStudentsModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private teacherExamService: TeacherExamService,
    private toastService: ToastService
  ) {}

  // Action menu items
  getActionMenuItems(student: any): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];
    
    // View answer sheet - only available for completed exams
    if (student.status === 'COMPLETED') {
      items.push({
        id: 'view-sheet',
        label: 'View Answer Sheet',
        icon: 'fa-eye',
        action: 'viewAnswerSheet'
      });
    }
    
    // View cheating logs - available for all statuses except NOT_STARTED
    if (student.status !== 'NOT_STARTED') {
      items.push({
        id: 'view-logs',
        label: 'View Cheating Logs',
        icon: 'fa-shield-alt',
        action: 'viewCheatLogs'
      });
    }
    
    // Ban/Unban student
    if (student.status === 'BANNED') {
      items.push({
        id: 'unban',
        label: 'Unban Student',
        icon: 'fa-user-check',
        action: 'unbanStudent'
      });
    } else {
      items.push({
        id: 'ban',
        label: 'Ban Student',
        icon: 'fa-ban',
        action: 'banStudent',
      });
    }
    
    return items;
  }

  // Handle action menu events
  handleMenuAction(event: { action: string; id: string }): void {
    const student = this.students.find(s => s.student.id === event.id);
    if (!student) return;
    
    switch (event.action) {
      case 'viewAnswerSheet':
        this.viewStudentAnswerSheet(student);
        break;
        
      case 'viewCheatLogs':
        this.viewStudentCheatLogs(student);
        break;
        
      case 'banStudent':
      case 'unbanStudent':
        this.toggleBanStudent(student);
        break;
        
      default:
        console.warn('Unknown action:', event.action);
    }
  }
  
  viewStudentAnswerSheet(student: any): void {
    this.router.navigate(['/teacher/exams', this.examId, 'students', student.student.id, 'answer-sheet']);
  }
  
  viewStudentCheatLogs(student: any): void {
    this.router.navigate(['/teacher/exams', this.examId, 'students', student.student.id, 'cheat-logs']);
  }
  
  @HostListener('document:click')
  closeDropdowns() {
    this.showStatusDropdown = false;
  }

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.examId) {
      this.error = 'Invalid exam ID';
      this.isLoading = false;
      return;
    }
    
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchQuery = term;
      this.loadFilteredStudents();
    });
    
    // Load initial data with statistics
    this.loadExamDetails();
    this.loadFilteredStudents();
  }

  loadExamDetails(): void {
    // Load exam details in parallel with student data
    this.examService.getExamById(this.examId)
      .subscribe({
        next: (exam: any) => {
          if (exam && exam.name && exam.subject) {
            this.examName = exam.name;
            this.subjectName = exam.subject.name;
          }
        },
        error: (error: any) => {
          console.error('Failed to load exam details:', error);
          // Don't show error here as we're already showing students loading error if needed
        }
      });
  }

  toggleStatusDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  loadFilteredStudents(): void {
    // Only show loading state for the table, not the whole component
    this.tableLoading = true;
    
    // Map UI status values to backend expected values
    let statusValue = '';
    if (this.activeFilter !== 'All') {
      // Send the status in the exact format the backend expects
      statusValue = this.activeFilter;
    }
    
    // Prepare filter options
    const options: StudentFilterOptions = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchQuery?.trim() || '',
      status: statusValue
    };
    
    console.log('Sending filter options:', options);
    
    this.teacherExamService.getFilteredStudents(this.examId, options)
      .pipe(finalize(() => {
        this.tableLoading = false;
        this.isLoading = false; // For initial load
      }))
      .subscribe({
        next: (response: any) => {
          console.log('API response:', response);
          
          // Extract data from the nested structure
          const data = response.data || response;
          
          // Make sure we have the students array
          this.students = data.students || [];
          
          // Update pagination if available
          if (data.pagination) {
            this.totalItems = data.pagination.total;
            this.totalPages = data.pagination.totalPages;
            this.currentPage = data.pagination.page;
          }
          
          // Update statistics if available
          if (data.statistics) {
            this.updateStatistics(data.statistics);
          }
        },
        error: (error: any) => {
          console.error('Failed to load students:', error);
          this.error = error.error?.message || 'Failed to load students';
          
          // If in development, use mock data for preview
          if (!environment.production) {
            this.useMockData();
          }
        }
      });
  }

  updateStatistics(statistics: StudentStatistics): void {
    this.totalStudents = statistics.totalStudents;
    this.completedCount = statistics.completedCount;
    this.inProgressCount = statistics.inProgressCount;
    this.notStartedCount = statistics.notStartedCount;
    this.bannedCount = statistics.bannedCount;
    this.averageScore = statistics.averageScore;
    this.passRate = statistics.passRate;
    this.passCount = statistics.passCount;
  }

  useMockData(): void {
    // Mock data for preview purposes - matches the screenshot
    this.students = [
      {
        student: {
          user: {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com'
          },
          rollNumber: 'CS-2021-01'
        },
        status: 'COMPLETED',
        statusText: 'Completed',
        submittedAt: '2025-04-10T03:15:00.000Z',
        result: { marks: '28/30' }
      },
      {
        student: {
          user: {
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob.smith@example.com'
          },
          rollNumber: 'CS-2021-02'
        },
        status: 'COMPLETED',
        statusText: 'Completed',
        submittedAt: '2025-04-10T03:20:00.000Z',
        result: { marks: '22/30' }
      },
      {
        student: {
          user: {
            firstName: 'Charlie',
            lastName: 'Brown',
            email: 'charlie.brown@example.com'
          },
          rollNumber: 'CS-2021-03'
        },
        status: 'IN_PROGRESS',
        statusText: 'In Progress',
        submittedAt: null
      },
      {
        student: {
          user: {
            firstName: 'Diana',
            lastName: 'Prince',
            email: 'diana.prince@example.com'
          },
          rollNumber: 'CS-2021-04'
        },
        status: 'NOT_STARTED',
        statusText: 'Not Started',
        submittedAt: null
      },
      {
        student: {
          user: {
            firstName: 'Edward',
            lastName: 'Norton',
            email: 'edward.norton@example.com'
          },
          rollNumber: 'CS-2021-05'
        },
        status: 'BANNED',
        statusText: 'Banned',
        submittedAt: null
      }
    ];
    
    // Mock statistics
    this.totalStudents = 5;
    this.completedCount = 2;
    this.inProgressCount = 1;
    this.notStartedCount = 1;
    this.bannedCount = 1;
    this.averageScore = 25;
    this.passRate = 100;
    this.passCount = 2;
    
    // Mock pagination
    this.totalItems = 5;
    this.totalPages = 1;
  }

  applyFilter(filter: 'All' | 'Completed' | 'In Progress' | 'Not Started' | 'Banned'): void {
    this.activeFilter = filter;
    this.showStatusDropdown = false;
    this.currentPage = 1; // Reset to first page when filter changes
    
    // Call API to get filtered students
    this.loadFilteredStudents();
  }

  search(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.loadFilteredStudents();
  }

  navigateBack(): void {
    this.router.navigate(['/teacher/exams', this.examId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleBanStudent(student: any): void {
    const studentId = student.student.id;
    const isBanned = student.status === 'BANNED';
    const action = isBanned ? 'unban' : 'ban';
    
    if (confirm(`Are you sure you want to ${action} this student?`)) {
      this.teacherExamService.toggleStudentBan(this.examId, studentId)
        .subscribe({
          next: () => {
            this.toastService.showSuccess(`Student ${action}ned successfully`);
            this.loadFilteredStudents();
          },
          error: (error: any) => {
            console.error(`Failed to ${action} student:`, error);
            this.toastService.showError(error.error?.message || `Failed to ${action} student`);
          }
        });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'IN_PROGRESS': return 'in-progress';
      case 'NOT_STARTED': return 'not-started';
      case 'BANNED': return 'banned';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'NOT_STARTED': return 'Not Started';
      case 'BANNED': return 'Banned';
      default: return status;
    }
  }

  // Open assign students modal
  openAssignStudentsModal(): void {
    this.showAssignStudentsModal = true;
  }
  
  // Close assign students modal
  closeAssignStudentsModal(refresh: boolean = false): void {
    this.showAssignStudentsModal = false;
    
    // If refresh is true, reload the students list
    if (refresh) {
      this.loadFilteredStudents();
    }
  }
} 