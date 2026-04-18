import { Component, Input } from "@angular/core";
import { NgClass } from "@angular/common";
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-icon-button",
  standalone: true,
  imports: [NgClass, AppIconComponent],
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.css",
})
export class IconButtonComponent {
  @Input() icon: string = "ShoppingCart";
  @Input() variant: "light" | "dark" = "light";
}
