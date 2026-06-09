import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { Review, CreateReview } from "../models/review";
import { ApiHttpClient } from "../http/http-client";

@Injectable({
  providedIn: "root",
})
export class ReviewService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/reviews";

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`${this.baseUrl}/products/${productId}`);
  }

  getFeaturedReviews(): Observable<Review[]> {
    return this.api.get<Review[]>(`${this.baseUrl}/featured`);
  }

  addReview(productId: number, review: CreateReview): Observable<Review> {
    return this.api.post<Review>(
      `${this.baseUrl}/products/${productId}`,
      review,
    );
  }
}
