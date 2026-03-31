import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProductService } from "../../../../core/services/product.service";
import { map } from "rxjs";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { HeroComponent } from "../../components/hero/hero.component";
import { NewArrivalsComponent } from "../../components/new-arrivals/new-arrivals.component";
import { FeaturedProductsComponent } from "../../components/featured-products/featured-products.component";
import { WhyChooseUsComponent } from "../../components/why-choose-us/why-choose-us.component";
import { TestimonialsComponent } from "../../components/testimonials/testimonials.component";
import { NewsletterComponent } from "../../components/newsletter/newsletter.component";
import { CampaignSpotlightComponent } from "../../components/campaign-spotlight/campaign-spotlight.component";

import { CategorySectionComponent } from "../../components/category-section/category-section.component";
import { PromoBannerComponent } from "../../components/promo-banner/promo-banner.component";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroComponent,
    NewArrivalsComponent,
    FeaturedProductsComponent,
    WhyChooseUsComponent,
    TestimonialsComponent,
    NewsletterComponent,
    CategorySectionComponent,
    PromoBannerComponent
],
  templateUrl: "./home-page.component.html",
  styleUrl: "./home-page.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  private readonly productService = inject(ProductService);
  private readonly imageUrlService = inject(ImageUrlService);

  homeData$ = this.productService.getHomeData();

  heroSlides$ = this.homeData$.pipe(
    map((data) =>
      data.banners
        .map((b) => ({
          image: b.imageUrl, // Pass raw path, HeroComponent uses imageUrlService
          title: b.title,
          subtitle: b.subtitle,
          link: b.linkUrl || "/shop",
          linkText: b.buttonText || "Shop Now",
          type: b.type
        })),
    ),
  );

  newArrivals$ = this.homeData$.pipe(map((data) => data.newArrivals));
  featuredProducts$ = this.homeData$.pipe(map((data) => data.featuredProducts));
  categories$ = this.homeData$.pipe(map((data) => data.categories));

  // Helper methods to filter categories for specific sections
  getCategory(categories: any[], slug: string) {
    return categories.find((c) => c.slug === slug)?.subCategories || [];
  }
}
