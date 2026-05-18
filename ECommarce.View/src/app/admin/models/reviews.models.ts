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
  screenshotUrl?: string;
}

export interface ReviewUpdatePayload {
  rating: number;
  comment: string;
  screenshotUrl?: string;
}
