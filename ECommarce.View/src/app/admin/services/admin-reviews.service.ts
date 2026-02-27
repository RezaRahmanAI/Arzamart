import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface AdminReview {
  id: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  productId: number;
  productName: string;
  likes: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminReviewsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/reviews";

  getAll(): Observable<AdminReview[]> {
    return this.api.get<AdminReview[]>(this.baseUrl);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  update(
    id: number,
    payload: { rating: number; comment: string },
  ): Observable<AdminReview> {
    return this.api.post<AdminReview>(`${this.baseUrl}/${id}`, payload);
  }
}
