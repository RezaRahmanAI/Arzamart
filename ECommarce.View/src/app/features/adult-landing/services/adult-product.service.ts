import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdultProduct, AdultProductCreateUpdatePayload } from '../../../admin/models/adult-product.models';

@Injectable({
  providedIn: 'root'
})
export class AdultProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/adultproducts`;

  getBySlug(slug: string): Observable<AdultProduct> {
    return this.http.get<AdultProduct>(`${this.apiUrl}/${slug}`);
  }

  getById(id: number): Observable<AdultProduct> {
    return this.http.get<AdultProduct>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<AdultProduct[]> {
    return this.http.get<AdultProduct[]>(this.apiUrl);
  }

  create(product: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.http.post<AdultProduct>(this.apiUrl, product);
  }

  update(id: number, product: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.http.put<AdultProduct>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
