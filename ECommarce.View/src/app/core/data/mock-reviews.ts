import { Review } from "../models/review";

export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    productId: 1,
    customerName: "Sarah A.",
    rating: 5,
    comment: `The silk is so soft and opaque, exactly what I was looking for. The sizing is perfect (I got a Medium and I'm 5'6"). Will definitely order in other colors.`,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isVerifiedPurchase: true,
    isFeatured: false,
    likes: 12,
  },
  {
    id: 2,
    productId: 1,
    customerName: "Fatima K.",
    rating: 4,
    comment:
      "The color is exactly as pictured, a very deep beautiful blue. It was a bit long for me but easily hemmed. Very elegant flow.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    isVerifiedPurchase: true,
    isFeatured: false,
    likes: 8,
  },
];
