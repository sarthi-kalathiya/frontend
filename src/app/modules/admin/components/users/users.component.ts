import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserData } from '../../../../core/models/auth.models';
import { UserService, UserFilter } from '../../../../core/services/user.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddUserModalComponent } from './add-user-modal/add-user-modal.component';
import { ViewUserModalComponent } from './view-user-modal/view-user-modal.component';
import { EditUserModalComponent } from './edit-user-modal/edit-user-modal.component';
import { ManageSubjectsModalComponent } from './manage-subjects-modal/manage-subjects-modal.component';
import { ConfirmationModalService } from '../../../../core/services/confirmation-modal.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ActionMenuComponent, ActionMenuItem } from '../../../../shared/components/action-menu/action-menu.component';

interface CacheEntry {
  data: UserData[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: number;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AddUserModalComponent, 
    ViewUserModalComponent, 
    EditUserModalComponent,
    ManageSubjectsModalComponent,
    ActionMenuComponent
  ]
})
export class UsersComponent implements OnInit, OnDestroy {
  // User data
  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  
  // Filters
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  
  selectedRole: string = 'All Roles';
  selectedStatus: string = 'All Statuses';
  
  // UI state
  activeActionMenu: string | null = null;
  showRoleDropdown: boolean = false;
  showStatusDropdown: boolean = false;
  isLoading: boolean = false;
  error: string = '';
  showAddUserModal: boolean = false;
  showViewUserModal: boolean = false;
  showEditUserModal: boolean = false;
  showManageSubjectsModal: boolean = false;
  selectedUserId: string = '';
  selectedUserName: string = '';
  selectedUserRole: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Cache system
  private cache: { [key: string]: CacheEntry } = {};
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // Add Math object reference for template
  Math = Math;
  
  // New property to track menus that should flip up
  flipUpMenuIds: Set<string> = new Set();
  
  // Add properties to track dropdown position
  dropdownPosition = { top: 0, left: 0 };
  
  constructor(
    private userService: UserService,
    private confirmationModalService: ConfirmationModalService,
    private toastService: ToastService
  ) {}
  
  @HostListener('document:click')
  closeDropdowns() {
    this.activeActionMenu = null;
    this.showRoleDropdown = false;
    this.showStatusDropdown = false;
  }
  
  ngOnInit(): void {
    // Set up debounced search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400), // Wait 400ms after the user stops typing
      distinctUntilChanged() // Only emit if the value changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on search
      this.loadUsers();
    });
    
    // Load initial users
    this.loadUsers();
    
    // Try to restore cache from sessionStorage
    const savedCache = sessionStorage.getItem('usersCache');
    if (savedCache) {
      try {
        this.cache = JSON.parse(savedCache);
        
        // Clean up any expired cache entries
        this.cleanExpiredCache();
      } catch (e) {
        console.error('Error parsing cached data', e);
        sessionStorage.removeItem('usersCache');
      }
    }
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  
  loadUsers(): void {
    // Create a cache key based on current filters
    const cacheKey = this.createCacheKey();
    
    // Check if we already have valid cached data
    if (this.cache[cacheKey] && this.isCacheValid(this.cache[cacheKey])) {
      console.log('Using cached data for', cacheKey);
      this.processCachedData(this.cache[cacheKey]);
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    
    // Build filters
    const filters: UserFilter = {
      page: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined
    };
    
    // Add role filter if not "All Roles"
    if (this.selectedRole !== 'All Roles') {
      filters.role = this.selectedRole;
    }
    
    // Add status filter if not "All Statuses"
    if (this.selectedStatus !== 'All Statuses') {
      filters.isActive = this.selectedStatus === 'Active';
    }
    
    console.log('Fetching data for', cacheKey);
    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Cache the response with a timestamp
        this.cacheData(cacheKey, {
          data: response.data,
          pagination: response.pagination,
          timestamp: Date.now()
        });
        
        // Update component state
        this.users = response.data;
        this.filteredUsers = response.data;
        
        // Update pagination
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        this.currentPage = response.pagination.page;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to load users';
        console.error('Error loading users:', err);
      }
    });
  }
  
  // For input event
  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }
  
  // Old method kept for backward compatibility
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }
  
  onRoleChange(): void {
    this.currentPage = 1; // Reset to first page on filter change
    this.loadUsers();
  }
  
  onStatusChange(): void {
    this.currentPage = 1; // Reset to first page on filter change
    this.loadUsers();
  }
  
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.loadUsers();
  }
  
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
  
  toggleRoleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showRoleDropdown = !this.showRoleDropdown;
    this.showStatusDropdown = false;
  }
  
  toggleStatusDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showStatusDropdown = !this.showStatusDropdown;
    this.showRoleDropdown = false;
  }
  
  selectRole(role: string): void {
    this.selectedRole = role;
    this.showRoleDropdown = false;
    this.onRoleChange();
  }
  
  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.onStatusChange();
  }
  
  toggleActionMenu(userId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    // If we're closing the menu, just update the state
    if (this.activeActionMenu === userId) {
      this.activeActionMenu = null;
      return;
    }
    
    // Opening the menu
    this.activeActionMenu = userId;
    
    // Position the dropdown if we have an event
    if (event) {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      // Get position of the clicked button
      const buttonElement = event.target as HTMLElement;
      const button = buttonElement.closest('.btn-icon') || buttonElement;
      const buttonRect = button.getBoundingClientRect();
      
      // Calculate if the menu would go off screen (assuming menu height ~120px)
      const estimatedMenuHeight = 120;
      const shouldFlip = buttonRect.bottom + estimatedMenuHeight > viewportHeight;
      
      // Clear previous flip states
      this.flipUpMenuIds.clear();
      
      // Set dropdown position
      setTimeout(() => {
        // We use setTimeout to ensure the dropdown container is rendered
        const dropdownContainer = document.querySelector('.action-dropdown-container') as HTMLElement;
        if (dropdownContainer) {
          if (shouldFlip) {
            // Position above the button
            this.flipUpMenuIds.add(userId);
            dropdownContainer.style.top = (buttonRect.top - estimatedMenuHeight) + 'px';
          } else {
            // Position below the button
            dropdownContainer.style.top = buttonRect.bottom + 'px';
          }
          dropdownContainer.style.left = (buttonRect.left - 120 + buttonRect.width) + 'px';
          
          console.log('Positioned dropdown:', {
            buttonRect,
            shouldFlip,
            top: dropdownContainer.style.top,
            left: dropdownContainer.style.left
          });
        }
      }, 0);
    }
  }
  
  viewUser(userId: string): void {
    this.selectedUserId = userId;
    this.showViewUserModal = true;
    this.activeActionMenu = null;
  }
  
  editUser(userId: string): void {
    this.selectedUserId = userId;
    this.showEditUserModal = true;
    this.activeActionMenu = null;
  }
  
  deleteUser(userId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    this.confirmationModalService.confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.toastService.showSuccess('User deleted successfully');
            // Clear cache after modifying data
            this.clearCache();
            // Reload the current page
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            this.toastService.showError('Failed to delete user. Please try again.');
          }
        });
      }
    });
    
    this.activeActionMenu = null;
  }
  
  toggleUserStatus(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = !user.isActive;
    const actionName = newStatus ? 'activate' : 'deactivate';
    
    this.confirmationModalService.confirm({
      title: `Confirm ${actionName} user`,
      message: `Are you sure you want to ${actionName} this user?`,
      confirmButtonText: 'Yes, ' + actionName,
      cancelButtonText: 'Cancel',
      type: 'warning'
    }).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.userService.updateUserStatus(userId, newStatus).subscribe({
          next: (response) => {
            // Update the local user data first for immediate UI update
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
              this.users[userIndex].isActive = newStatus;
              
              // Also update in filteredUsers if it exists
              const filteredIndex = this.filteredUsers.findIndex(u => u.id === userId);
              if (filteredIndex !== -1) {
                this.filteredUsers[filteredIndex].isActive = newStatus;
              }
            }
            
            this.toastService.showSuccess(`User ${actionName}d successfully`);
            
            // Clear cache and load users from server to ensure data consistency
            this.clearCache();
            this.loadUsers();
          },
          error: (error) => {
            console.error(`Error ${actionName}ing user:`, error);
            this.toastService.showError(error.message || `Failed to ${actionName} user`);
          }
        });
      }
    });
  }
  
  manageSubjects(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.selectedUserId = userId;
      this.selectedUserName = user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : user.name || '';
      this.selectedUserRole = user.role;
      this.showManageSubjectsModal = true;
      this.activeActionMenu = null;
    }
  }
  
  // Generate an array of page numbers for pagination
  getPageNumbers(): number[] {
    const visiblePages = 5; // Number of page buttons to show
    const pages: number[] = [];
    
    if (this.totalPages <= visiblePages) {
      // If we have fewer pages than visible count, show all
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end based on current page
      let start = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
      let end = start + visiblePages - 1;
      
      // Adjust if end exceeds total pages
      if (end > this.totalPages) {
        end = this.totalPages;
        start = Math.max(1, end - visiblePages + 1);
      }
      
      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis indicators
      if (start > 1) {
        pages.unshift(1);
        if (start > 2) pages.splice(1, 0, -1); // -1 represents ellipsis
      }
      
      if (end < this.totalPages) {
        if (end < this.totalPages - 1) pages.push(-1); // -1 represents ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
  
  // User modal methods
  openAddUserModal(): void {
    this.showAddUserModal = true;
  }
  
  closeAddUserModal(refresh?: boolean): void {
    this.showAddUserModal = false;
    
    // If refresh is true, reload the users list
    if (refresh) {
      this.clearCache(); // Clear cache to get fresh data
      this.loadUsers();
    }
  }
  
  closeViewUserModal(): void {
    this.showViewUserModal = false;
  }
  
  closeEditUserModal(refresh?: boolean): void {
    this.showEditUserModal = false;
    
    // If refresh is true, reload the users list
    if (refresh) {
      this.clearCache(); // Clear cache to get fresh data
      this.loadUsers();
    }
  }
  
  closeManageSubjectsModal(refresh?: boolean): void {
    this.showManageSubjectsModal = false;
    
    // If refresh is true, reload the users list
    if (refresh) {
      this.clearCache(); // Clear cache to get fresh data
      this.loadUsers();
    }
  }
  
  // Cache-related methods
  private createCacheKey(): string {
    return `page=${this.currentPage}_size=${this.pageSize}_search=${this.searchTerm}_role=${this.selectedRole}_status=${this.selectedStatus}`;
  }
  
  private isCacheValid(cacheEntry: CacheEntry): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheExpiration;
  }
  
  private processCachedData(cacheEntry: CacheEntry): void {
    this.users = cacheEntry.data;
    this.filteredUsers = cacheEntry.data;
    this.totalItems = cacheEntry.pagination.total;
    this.totalPages = cacheEntry.pagination.totalPages;
    this.currentPage = cacheEntry.pagination.page;
  }
  
  private cacheData(key: string, data: CacheEntry): void {
    this.cache[key] = data;
    
    // Store in sessionStorage for persistence
    try {
      sessionStorage.setItem('usersCache', JSON.stringify(this.cache));
    } catch (e) {
      console.error('Error saving cache to sessionStorage', e);
      // If we hit storage limits, clear and try again
      sessionStorage.removeItem('usersCache');
      this.cleanExpiredCache();
      try {
        sessionStorage.setItem('usersCache', JSON.stringify(this.cache));
      } catch (e) {
        console.error('Still cannot save cache, abandoning persistence', e);
      }
    }
  }
  
  private cleanExpiredCache(): void {
    const now = Date.now();
    const newCache: { [key: string]: CacheEntry } = {};
    
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp < this.cacheExpiration) {
        newCache[key] = this.cache[key];
      }
    });
    
    this.cache = newCache;
  }
  
  // Clear cache (call after actions that modify data)
  clearCache(): void {
    this.cache = {};
    sessionStorage.removeItem('usersCache');
  }
  
  // Get menu items for a user
  getUserMenuItems(user: UserData): ActionMenuItem[] {
    const menuItems: ActionMenuItem[] = [
      {
        id: 'edit',
        label: 'Edit',
        icon: 'fa-edit',
        action: 'edit'
      },
      {
        id: 'view',
        label: 'View',
        icon: 'fa-eye',
        action: 'view'
      },
      {
        id: 'toggle-status',
        label: user.isActive ? 'Deactivate' : 'Activate',
        icon: user.isActive ? 'fa-ban' : 'fa-check-circle',
        action: 'toggle-status'
      }
    ];
    
    // Add manage subjects option for teachers and students
    if (user.role === 'TEACHER' || user.role === 'STUDENT') {
      menuItems.push({
        id: 'manage-subjects',
        label: 'Manage Subjects',
        icon: 'fa-book',
        action: 'manage-subjects'
      });
    }
    
    return menuItems;
  }
  
  // Handle action from menu
  handleMenuAction(event: {action: string, id: string}): void {
    const userId = event.id;
    const action = event.action;
    
    switch(action) {
      case 'view':
        this.viewUser(userId);
        break;
      case 'edit':
        this.editUser(userId);
        break;
      case 'toggle-status':
        this.toggleUserStatus(userId);
        break;
      case 'manage-subjects':
        this.manageSubjects(userId);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
} 