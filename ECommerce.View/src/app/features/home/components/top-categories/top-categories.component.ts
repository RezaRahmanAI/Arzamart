import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Category, SubCategory } from "../../../../core/models/category";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-top-categories",
  standalone: true,
  imports: [NgFor, NgIf, RouterModule, AppIconComponent],
  templateUrl: "./top-categories.component.html",
  styleUrl: "./top-categories.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopCategoriesComponent {
  @Input() categories: (Category | SubCategory)[] = [];

  constructor(public readonly imageUrlService: ImageUrlService) {}
}
