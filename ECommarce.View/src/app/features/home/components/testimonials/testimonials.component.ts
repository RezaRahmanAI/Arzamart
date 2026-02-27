import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReviewService } from "../../../../core/services/review.service";
import { Review } from "../../../../core/models/review";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { LucideAngularModule, Quote, Star, StarHalf } from "lucide-angular";

@Component({
  selector: "app-testimonials",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: "./testimonials.component.html",
  styleUrl: "./testimonials.component.css",
})
export class TestimonialsComponent implements OnInit {
  readonly icons = {
    Quote,
    Star,
    StarHalf,
  };
  reviews: Review[] = [];
  stars = [1, 2, 3, 4, 5];

  private readonly reviewService = inject(ReviewService);
  readonly imageUrlService = inject(ImageUrlService);

  ngOnInit(): void {
    this.reviewService.getFeaturedReviews().subscribe((reviews) => {
      this.reviews = reviews;
    });
  }

  getStarIcon(rating: number, star: number): any {
    if (rating >= star) {
      return this.icons.Star;
    }

    if (rating + 0.5 >= star) {
      return this.icons.StarHalf;
    }

    return this.icons.Star;
  }
}
