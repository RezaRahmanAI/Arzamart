import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ImageUrlService {
  /**
   * Converts relative image URLs to absolute URLs pointing to the backend server
   * @param imageUrl - The image URL (can be relative or absolute)
   * @returns Absolute URL to the image
   */
  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl || typeof imageUrl !== "string") {
      return "assets/images/placeholder.png";
    }

    const trimmedUrl = imageUrl.trim();

    // If it's a data URI or blob URL (local preview), return as is
    if (trimmedUrl.startsWith("data:") || trimmedUrl.startsWith("blob:")) {
      return trimmedUrl;
    }

    // If it's already an absolute URL, return as is
    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    // Convert relative URL to absolute URL using backend base URL
    // environment.apiBaseUrl is typically something like "https://api.example.com/api"
    // We want the root domain for static files.
    const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, "");
    const cleanPath = trimmedUrl.startsWith("/")
      ? trimmedUrl
      : "/" + trimmedUrl;

    const finalUrl = `${baseUrl}${cleanPath}`;

    return finalUrl;
  }
}
