import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../../core/services/user.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-view-user-modal',
  templateUrl: './view-user-modal.component.html',
  styleUrls: ['./view-user-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ViewUserModalComponent implements OnInit {
  @Input() userId!: string;
  @Output() close = new EventEmitter<boolean>();
  
  user: any = null;
  isLoading = true;
  error = '';
  
  constructor(
    private userService: UserService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadUserDetails();
  }
  
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = '';
    
    this.userService.getUserById(this.userId).subscribe({
      next: (response) => {
        this.user = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Failed to load user details';
        this.toastService.showError(this.error);
      }
    });
  }
  
  // Format date string to a more readable format
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
  
  // Get role badge class
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'badge-primary';
      case 'TEACHER':
        return 'badge-info';
      case 'STUDENT':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }
  
  // Format role name for display
  getRoleName(role: string): string {
    return role.charAt(0) + role.slice(1).toLowerCase();
  }
  
  closeModal(): void {
    this.close.emit(false);
  }
} 