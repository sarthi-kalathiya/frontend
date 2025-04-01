export interface TeacherProfileData {
  qualification: string;
  expertise: string;
  experience: number;
  bio: string;
}

export interface StudentProfileData {
  rollNumber: string;
  grade: string;
  parentContactNumber: string;
}

export interface ProfileStatusResponse {
  profileCompleted: boolean;
  role: string;
  requiresAdditionalSetup: boolean;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}
