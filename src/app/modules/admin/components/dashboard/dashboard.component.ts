import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserData } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: UserData | null = null;
  currentDate: Date = new Date();
  
  private authService = inject(AuthService);

  constructor() {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.user$.subscribe((user: UserData | null) => {
      this.currentUser = user;
    });
  }
} 