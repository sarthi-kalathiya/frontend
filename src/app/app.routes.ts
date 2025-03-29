import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { LayoutComponent } from './modules/shared/components/layout/layout.component';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { SignupComponent } from './modules/auth/components/signup/signup.component';
import { AdminDashboardComponent } from './modules/admin/components/dashboard/dashboard.component';
import { ProfileComponent } from './modules/admin/components/profile/profile.component';

export const routes: Routes = [
  // Auth routes - simplify to a single login and admin signup
  {
    path: 'auth',
    // Temporarily remove NoAuthGuard to fix loading issue
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'admin/signup', component: SignupComponent },
      { path: '**', redirectTo: 'login' }
    ]
  },
  
  // Admin routes
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', loadComponent: () => import('./modules/admin/components/users/users.component').then(c => c.UsersComponent) },
      { path: 'subjects', loadComponent: () => import('./modules/admin/components/subjects/subjects.component').then(c => c.SubjectsComponent) },
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  
  // Teacher routes
  {
    path: 'teacher',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['TEACHER'] },
    children: [
      { path: 'dashboard', loadComponent: () => import('./modules/teacher/components/dashboard/teacher-dashboard.component').then(c => c.TeacherDashboardComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  
  // Student routes
  {
    path: 'student',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['STUDENT'] },
    children: [
      { path: 'dashboard', loadComponent: () => import('./modules/student/components/dashboard/student-dashboard.component').then(c => c.StudentDashboardComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  
  // Default routes
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
