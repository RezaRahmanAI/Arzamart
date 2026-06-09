import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProductService } from "../../../../core/services/product.service";
import { map } from "rxjs";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { HeroComponent } from "../../components/hero/hero.component";
import { NewArrivalsComponent } from "../../components/new-arrivals/new-arrivals.component";
import { WhyChooseUsComponent } from "../../components/why-choose-us/why-choose-us.component";
import { TestimonialsComponent } from "../../components/testimonials/testimonials.component";
import { NewsletterComponent } from "../../components/newsletter/newsletter.component";

import { CategorySectionComponent } from "../../components/category-section/category-section.component";
import { PromoBannerComponent } from "../../components/promo-banner/promo-banner.component";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    HeroComponent,
    NewArrivalsComponent,
    WhyChooseUsComponent,
    TestimonialsComponent,
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

  heroSlides$ = this.productService.getHeroData().pipe(
    map((banners) =>
      banners.map((b: any) => ({
        image: b.imageUrl,
        title: b.title,
        subtitle: b.subtitle,
        link: b.linkUrl || "/shop",
        linkText: b.buttonText || "Shop Now",
        type: b.type
      }))
    ),
  );

  newArrivals$ = this.productService.getNewArrivalsData();
  categories$ = this.productService.getHomeData().pipe(map((data) => data.categories));

  getCategory(categories: any[], slug: string) {
    return categories.find((c) => c.slug === slug)?.subCategories || [];
  }
}
