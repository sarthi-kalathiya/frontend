import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserData } from '../../../core/models/auth.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class StudentLayoutComponent implements OnInit {
  currentUser: UserData | null = null;
  searchQuery: string = '';
  showUserMenu: boolean = false;
  activeTab: string = 'dashboard';

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user: UserData | null) => {
      this.currentUser = user;
    });

    // Set active tab based on current route
    const currentUrl = this.router.url;
    if (currentUrl.includes('/student/dashboard')) {
      this.activeTab = 'dashboard';
    } else if (currentUrl.includes('/student/exams')) {
      this.activeTab = 'exams';
    } else if (currentUrl.includes('/student/courses')) {
      this.activeTab = 'courses';
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
    this.activeTab = route.split('/').pop() || 'dashboard';
    this.closeAllDropdowns();
  }

  closeAllDropdowns(): void {
    this.showUserMenu = false;
  }

  handleUserMenuClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleUserMenu();
  }

  searchSubmit(): void {
    // Implement search functionality
    console.log('Search query:', this.searchQuery);
  }

  // Helper method to get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser) return '';

    const firstInitial = this.currentUser.firstName
      ? this.currentUser.firstName.charAt(0)
      : '';
    const lastInitial = this.currentUser.lastName
      ? this.currentUser.lastName.charAt(0)
      : '';

    return (firstInitial + lastInitial).toUpperCase();
  }
}
