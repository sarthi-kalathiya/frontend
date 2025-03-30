import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeacherProfileData, StudentProfileData } from '../models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get the user's profile completion status
   */
  getProfileStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/profile-status`);
  }

  /**
   * Create or complete a teacher profile
   */
  completeTeacherProfile(profileData: TeacherProfileData): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/teacher-profile`, profileData);
  }

  /**
   * Create or complete a student profile
   */
  completeStudentProfile(profileData: StudentProfileData): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/student-profile`, profileData);
  }

  /**
   * Get the current user's profile details
   */
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/profile`);
  }

  /**
   * Update the user's profile
   */
  updateUserProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/profile`, profileData);
  }
}