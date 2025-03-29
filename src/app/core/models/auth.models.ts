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
  createdAt: string;
  updatedAt: string;
  hasCompletedProfile?: boolean;
  profilePicture?: string;
}

export interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
} 