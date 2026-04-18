import { Component, inject, OnInit } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SiteSettingsService } from "../../core/services/site-settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [AsyncPipe, RouterModule],
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
