import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserData } from '../../../../core/models/auth.models';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgIf, NgFor, NgClass]
})
export class LayoutComponent implements OnInit {
  currentUser: UserData | null = null;
  searchQuery: string = '';
  showNotifications: boolean = false;
  showUserMenu: boolean = false;
  activeTab: string = 'dashboard';
  
  notifications = [
    { title: 'New User Registered', time: '2 minutes ago', read: false },
    { title: 'Server Error Alert', time: '1 hour ago', read: false },
    { title: 'Database Backup Complete', time: '3 hours ago', read: true },
    { title: 'New Payment Received', time: '6 hours ago', read: true }
  ];

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user: UserData | null) => {
      this.currentUser = user;
    });
    
    // Set active tab based on current route
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin/dashboard')) {
      this.activeTab = 'dashboard';
    } else if (currentUrl.includes('/admin/users')) {
      this.activeTab = 'users';
    } else if (currentUrl.includes('/admin/subjects')) {
      this.activeTab = 'subjects';
    } else if (currentUrl.includes('/admin/profile')) {
      this.activeTab = 'profile';
    }
  }
  
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }
  
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
  
  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
    this.activeTab = route.split('/').pop() || 'dashboard';
  }
  
  markAllAsRead(): void {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
  }
  
  closeAllDropdowns(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
  }
  
  searchSubmit(): void {
    // Implement search functionality
    console.log('Searching for:', this.searchQuery);
    this.searchQuery = '';
  }

  hasUnreadNotifications(): boolean {
    return this.notifications.some(notification => !notification.read);
  }
  
  handleNotificationClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleNotifications();
  }
  
  handleMarkAllRead(event: MouseEvent): void {
    event.stopPropagation();
    this.markAllAsRead();
  }
  
  handleUserMenuClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleUserMenu();
  }
} 