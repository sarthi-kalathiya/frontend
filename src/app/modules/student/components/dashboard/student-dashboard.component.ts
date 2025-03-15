import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Student Dashboard</h1>
        <p class="current-date">{{ currentDate | date:'fullDate' }}</p>
      </div>

      <div class="content-section">
        <div class="welcome-card">
          <h2>Hello, Student!</h2>
          <p>Welcome to the Student Dashboard. This is a placeholder page to verify that routing works correctly.</p>
          <p>Here you'll be able to view your courses, take exams, and check your grades.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 24px;
    }
    
    .dashboard-header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .dashboard-header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    .current-date {
      color: #666;
      margin: 0;
    }
    
    .welcome-card {
      background-color: #f8f8f8;
      border-radius: 4px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .welcome-card h2 {
      font-size: 20px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    .welcome-card p {
      color: #333;
      line-height: 1.5;
      margin-bottom: 12px;
    }
  `]
})
export class StudentDashboardComponent {
  currentDate = new Date();
} 