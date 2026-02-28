import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { Category } from "../../../../core/models/category";
import { SectionHeaderComponent } from "../../../../shared/components/section-header/section-header.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { LucideAngularModule, ArrowRight } from "lucide-angular";

@Component({
  selector: "app-category-grid",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./category-grid.component.html",
  styleUrl: "./category-grid.component.css",
})
export class CategoryGridComponent {
  readonly icons = {
    ArrowRight,
  };
  @Input() categories: Category[] = [];

  constructor(public readonly imageUrlService: ImageUrlService) {}
}
