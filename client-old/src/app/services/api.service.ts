import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Use localhost for development, easily overridden in deployment
  private apiUrl = (window as any).API_URL || 'http://localhost:5000/api'; 

  constructor(private http: HttpClient) {}

  getApplicants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resumes`);
  }

  getResumeDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumes/${id}`);
  }

  uploadResume(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  analyzeText(text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analyze`, { text });
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/resumes/${id}`, { status });
  }
}
