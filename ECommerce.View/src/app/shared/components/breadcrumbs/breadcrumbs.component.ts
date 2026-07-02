import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { RouterModule } from "@angular/router";

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: "app-breadcrumbs",
  standalone: true,
  imports: [RouterModule],
  templateUrl: "./breadcrumbs.component.html",
  styleUrl: "./breadcrumbs.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
