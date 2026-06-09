import { Component, Input } from "@angular/core";
import { NgIf, NgFor } from '@angular/common';
import { RouterModule } from "@angular/router";
import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-category-section",
  standalone: true,
  imports: [NgIf, RouterModule, NgFor],
  templateUrl: "./category-section.component.html",
})
export class CategorySectionComponent {
  @Input() title: string = "";
  @Input() viewAllLink: string = "/shop";
  @Input() categories: any[] = [];

  constructor(public imageUrlService: ImageUrlService) {}
}
