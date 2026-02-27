import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CategoryService } from "../../../../core/services/category.service";

import { HeroComponent } from "../../components/hero/hero.component";
import { CategoryGridComponent } from "../../components/category-grid/category-grid.component";
import { NewArrivalsComponent } from "../../components/new-arrivals/new-arrivals.component";
import { PromoBannerComponent } from "../../components/promo-banner/promo-banner.component";
import { FeaturedProductsComponent } from "../../components/featured-products/featured-products.component";
import { WhyChooseUsComponent } from "../../components/why-choose-us/why-choose-us.component";
import { TestimonialsComponent } from "../../components/testimonials/testimonials.component";
import { NewsletterComponent } from "../../components/newsletter/newsletter.component";
import { CampaignSpotlightComponent } from "../../components/campaign-spotlight/campaign-spotlight.component";

import { CategorySectionComponent } from "../../components/category-section/category-section.component";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroComponent,
    CategoryGridComponent,
    NewArrivalsComponent,
    PromoBannerComponent,
    FeaturedProductsComponent,
    WhyChooseUsComponent,
    TestimonialsComponent,
    NewsletterComponent,
    CampaignSpotlightComponent,
    CategorySectionComponent,
  ],
  templateUrl: "./home-page.component.html",
  styleUrl: "./home-page.component.css",
})
export class HomePageComponent {
  private readonly categoryService = inject(CategoryService);

  categories$ = this.categoryService.getCategories();

  // Helper methods to filter categories for specific sections
  getCategory(categories: any[], slug: string) {
    return categories.find((c) => c.slug === slug)?.subCategories || [];
  }
}
