import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-campaign-spotlight",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./campaign-spotlight.component.html",
  styles: [],
})
export class CampaignSpotlightComponent {
  spotlight = {
    title: "The Midnight Collection",
    subtitle: "Elegance in the Dark",
    description:
      "Discover the allure of our latest evening wear. Crafted for moments that matter.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", // Placeholder Lauxury Image
    link: "/women",
  };
  currentYear = new Date().getFullYear();
}
