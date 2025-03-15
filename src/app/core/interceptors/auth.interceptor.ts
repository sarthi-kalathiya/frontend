import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    // Log token for debugging
    console.log('Interceptor: Token available', !!accessToken);
    
    // If token exists, add it to the request headers
    if (accessToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('Added auth header to request');
    }

    // Continue with the modified request
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error in interceptor:', error);
        
        // Handle authentication errors (401 Unauthorized)
        if (error.status === 401) {
          console.log('Unauthorized request detected, redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          this.router.navigateByUrl('/auth/login');
        }
        
        // Handle forbidden errors (403 Forbidden)
        if (error.status === 403) {
          console.log('Forbidden request detected');
          // Redirect based on user role or to a forbidden page
          this.router.navigateByUrl('/auth/forbidden');
        }
        
        return throwError(() => error);
      })
    );
  }
} 