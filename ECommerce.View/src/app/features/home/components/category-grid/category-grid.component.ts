import { Component, Input } from "@angular/core";
import { NgIf, NgClass, NgFor } from '@angular/common';
import { RouterModule } from "@angular/router";

import { Category } from "../../../../core/models/category";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-category-grid",
  standalone: true,
  imports: [NgIf, NgClass, RouterModule, AppIconComponent, NgFor],
  templateUrl: "./category-grid.component.html",
  styleUrl: "./category-grid.component.css",
})
export class CategoryGridComponent {
  @Input() categories: Category[] = [];

  constructor(public readonly imageUrlService: ImageUrlService) {}
}
