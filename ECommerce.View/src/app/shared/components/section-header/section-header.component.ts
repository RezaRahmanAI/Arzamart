import { Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-section-header",
  standalone: true,
  imports: [RouterModule, AppIconComponent],
  templateUrl: "./section-header.component.html",
  styleUrl: "./section-header.component.css",
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() linkLabel = "View All";
  @Input() linkUrl = "#";
}
