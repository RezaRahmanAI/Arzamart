import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../../core/http/http-client";

export interface PublicReview {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  reviewImage?: string;
  likes: number;
}

@Injectable({
  providedIn: "root",
})
export class PublicReviewService {
  private api = inject(ApiHttpClient);

  getReviewsByProduct(productId: number): Observable<PublicReview[]> {
    return this.api.get<PublicReview[]>(`/reviews/product/${productId}`);
  }
}
