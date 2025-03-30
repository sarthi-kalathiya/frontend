import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserData } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: UserData | null = null;
  currentDate = new Date();
  
  // Statistics data
  totalExams = 12;
  activeExams = 3;
  totalStudents = 87;
  avgScore = 76;
  
  // Exam analytics data
  completionRateData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    completedValues: [40, 30, 45, 27, 38, 23],
    incompleteValues: [24, 13, 8, 10, 5, 12]
  };
  
  // Upcoming exams data
  upcomingExams = [
    {
      title: 'Midterm Exam',
      subject: 'Discrete Mathematics',
      date: new Date(2025, 3, 15, 10, 0) // Apr 15, 2025 at 10:00 AM
    },
    {
      title: 'Final Quiz',
      subject: 'Data Structures',
      date: new Date(2025, 3, 22, 14, 0) // Apr 22, 2025 at 2:00 PM
    },
    {
      title: 'Practical Test',
      subject: 'Algorithms',
      date: new Date(2025, 4, 5, 9, 0) // May 5, 2025 at 9:00 AM
    }
  ];
  
  activeTab = 'completion-rate';
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.user$.subscribe((user: UserData | null) => {
      this.currentUser = user;
    });
  }
  
  switchTab(tab: string): void {
    this.activeTab = tab;
  }
} 