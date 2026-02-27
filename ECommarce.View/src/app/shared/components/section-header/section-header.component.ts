import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { LucideAngularModule, ArrowRight } from "lucide-angular";

@Component({
  selector: "app-section-header",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./section-header.component.html",
  styleUrl: "./section-header.component.css",
})
export class SectionHeaderComponent {
  readonly icons = {
    ArrowRight,
  };
  @Input({ required: true }) title!: string;
  @Input() linkLabel = "View All";
  @Input() linkUrl = "#";
}
