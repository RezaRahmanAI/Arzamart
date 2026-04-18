import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { Category } from "../../../../core/models/category";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-category-grid",
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent],
  templateUrl: "./category-grid.component.html",
  styleUrl: "./category-grid.component.css",
})
export class CategoryGridComponent {
  @Input() categories: Category[] = [];

  constructor(public readonly imageUrlService: ImageUrlService) {}
}
