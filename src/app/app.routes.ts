import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { ProfileCompletionGuard } from './core/guards/profile-completion.guard';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { SignupComponent } from './modules/auth/components/signup/signup.component';
import { AdminDashboardComponent } from './modules/admin/components/dashboard/dashboard.component';
import { ProfileComponent } from './modules/admin/components/profile/profile.component';

// Import new role-specific layout components
import { AdminLayoutComponent } from './shared/components/admin-layout/admin-layout.component';
import { TeacherLayoutComponent } from './shared/components/teacher-layout/teacher-layout.component';
import { StudentLayoutComponent } from './shared/components/student-layout/student-layout.component';

// Import profile completion components
import { TeacherProfileCompletionComponent } from './modules/profile/components/teacher-profile-completion/teacher-profile-completion.component';

export const routes: Routes = [
  // Auth routes - simplify to a single login and admin signup
  {
    path: 'auth',
    // Temporarily remove NoAuthGuard to fix loading issue
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'admin/signup', component: SignupComponent },
      { path: '**', redirectTo: 'login' },
    ],
  },

  // Profile routes
  {
    path: 'profile',
    children: [
      {
        path: '',
        component: ProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'teacher/complete',
        component: TeacherProfileCompletionComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'student/complete',
        loadComponent: () =>
          import(
            './modules/profile/components/student-profile-completion/student-profile-completion.component'
          ).then((c) => c.StudentProfileCompletionComponent),
        canActivate: [AuthGuard],
      },
    ],
  },

  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'users',
        loadComponent: () =>
          import('./modules/admin/components/users/users.component').then(
            (c) => c.UsersComponent
          ),
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./modules/admin/components/subjects/subjects.component').then(
            (c) => c.SubjectsComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Teacher routes
  {
    path: 'teacher',
    component: TeacherLayoutComponent,
    canActivate: [AuthGuard, ProfileCompletionGuard],
    data: { roles: ['TEACHER'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './modules/teacher/components/dashboard/teacher-dashboard.component'
          ).then((c) => c.TeacherDashboardComponent),
      },
      {
        path: 'exams',
        loadComponent: () =>
          import('./modules/teacher/components/exams/exams.component').then(
            (c) => c.ExamsComponent
          ),
      },
      {
        path: 'exams/:id',
        loadComponent: () =>
          import('./modules/teacher/components/exams/exam-details/exam-details.component').then(
            (c) => c.ExamDetailsComponent
          ),
      },
      {
        path: 'exams/:id/manage-questions',
        loadComponent: () =>
          import('./modules/teacher/components/exams/manage-questions/manage-questions.component').then(
            (c) => c.ManageQuestionsComponent
          ),
      },
      {
        path: 'exams/:id/manage-students',
        loadComponent: () =>
          import('./modules/teacher/components/exams/manage-students/manage-students.component').then(
            (c) => c.ManageStudentsComponent
          ),
      },
      {
        path: 'exams/:id/students',
        loadComponent: () =>
          import('./modules/teacher/components/exams/manage-students/manage-students.component').then(
            (c) => c.ManageStudentsComponent
          ),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import(
            './modules/teacher/components/assignments/assignments.component'
          ).then((c) => c.AssignmentsComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import(
            './modules/teacher/components/students/students.component'
          ).then((c) => c.StudentsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Student routes
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [AuthGuard, ProfileCompletionGuard],
    data: { roles: ['STUDENT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './modules/student/components/dashboard/student-dashboard.component'
          ).then((c) => c.StudentDashboardComponent),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./modules/student/components/courses/courses.component').then(
            (c) => c.CoursesComponent
          ),
      },
      {
        path: 'exams',
        loadComponent: () =>
          import('./modules/student/components/exams/exams.component').then(
            (c) => c.ExamsComponent
          ),
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./modules/student/components/results/results.component').then(
            (c) => c.ResultsComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Standalone routes without layout
  {
    path: 'standalone',
    canActivate: [AuthGuard, ProfileCompletionGuard],
    children: [
      {
        path: 'teacher/exams/:id/manage-students',
        loadComponent: () =>
          import('./modules/teacher/components/exams/manage-students/manage-students.component').then(
            (c) => c.ManageStudentsComponent
          ),
      }
    ]
  },

  // Default routes
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' },
];
