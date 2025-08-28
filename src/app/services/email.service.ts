import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

 /*  sendWelcome(dto: { toEmail: string; toName: string; templateId: number; params?: any }) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'x-client-key': import.meta.env.VITE_CLIENT_EMAIL_KEY ?? ''
    });
    return this.http.post(`${this.base}/email/welcome`, dto, { headers });
  } */
  sendWelcome(dto: { toEmail: string; toName: string; templateId: number; params?: any }) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.base}/email/welcome`, dto, { headers });
  }
  
}
