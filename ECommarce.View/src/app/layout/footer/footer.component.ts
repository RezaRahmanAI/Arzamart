import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SiteSettingsService } from "../../core/services/site-settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.css",
})
export class FooterComponent implements OnInit {
  settingsService = inject(SiteSettingsService);
  imageUrlService = inject(ImageUrlService);
  settings$ = this.settingsService.getSettings();
  currentYear = new Date().getFullYear();

  ngOnInit() {
    // settings$ is already an observable from getSettings() which uses shareReplay
  }
}
