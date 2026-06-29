import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { AdminReview } from "../models/reviews.models";

@Injectable({
  providedIn: "root",
})
export class ReviewsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/reviews";

  getAll(): Observable<AdminReview[]> {
    return this.api.get<any[]>(this.baseUrl).pipe(
      map(reviews => reviews.map(r => ({
        ...r,
        userName: r.customerName,
        userAvatar: r.customerAvatar,
        createdAt: r.date, // mapping date to createdAt if needed
        screenshotUrl: r.screenshotUrl
      })))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${id}/delete`, {});
  }

  create(payload: any): Observable<AdminReview> {
    return this.api.post<AdminReview>(this.baseUrl, payload);
  }

  update(id: number, payload: any): Observable<AdminReview> {
    const backendPayload = {
      customerName: payload.userName,
      customerAvatar: payload.userAvatar,
      rating: payload.rating,
      comment: payload.comment,
      isVerifiedPurchase: payload.isVerifiedPurchase,
      screenshotUrl: payload.screenshotUrl
    };
    return this.api.post<AdminReview>(`${this.baseUrl}/${id}`, backendPayload);
  }
}
