import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type ContactPayload = {
  fullName: string;
  email: string;
  inquiryType: string;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  submitContact(payload: ContactPayload): Observable<ContactPayload> {
    return of(payload).pipe(delay(900));
  }
}
