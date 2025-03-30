export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: UserData;
  };
}

export interface UserData {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  contactNumber: string;
  isActive: boolean;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  hasCompletedProfile?: boolean;
  profilePicture?: string;
  teacher?: TeacherData;
  student?: StudentData;
}

export interface TeacherData {
  id: string;
  userId: string;
  qualification: string;
  expertise: string;
  experience: number;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentData {
  id: string;
  userId: string;
  rollNumber: string;
  grade: string;
  parentContactNumber: string;
  joiningDate: string;
  completedExams: number;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}