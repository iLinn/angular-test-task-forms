import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckUserResponseData, SubmitFormResponseData } from '../shared/interface/responses';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  checkUsernameAvailability(username: string): Observable<CheckUserResponseData> {
    return this.http.post<CheckUserResponseData>('/api/checkUsername', { username });
  }

  submitForms(forms: any[]): Observable<SubmitFormResponseData> {
    return this.http.post<SubmitFormResponseData>('/api/submitForm', { forms });
  }
}