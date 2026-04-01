import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdultProduct, AdultProductCreateUpdatePayload } from '../models/adult-product.models';

@Injectable({
  providedIn: 'root'
})
export class AdultProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/adultproducts`;

  getAll(): Observable<AdultProduct[]> {
    return this.http.get<AdultProduct[]>(this.apiUrl);
  }

  getById(id: number): Observable<AdultProduct> {
    return this.http.get<AdultProduct>(`${this.apiUrl}/${id}`);
  }

  create(payload: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.http.post<AdultProduct>(this.apiUrl, payload);
  }

  update(id: number, payload: AdultProductCreateUpdatePayload): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
