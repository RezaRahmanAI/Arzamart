export interface Review {
  id: number;
  productId: number;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  likes: number;
}

export interface CreateReview {
  productId: number;
  customerName: string;
  rating: number;
  comment: string;
}
