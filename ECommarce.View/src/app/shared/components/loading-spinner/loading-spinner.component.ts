import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingService } from "../../../core/services/loading.service";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingService.loading$ | async" class="loading-overlay">
      <div class="spinner-container">
        <div class="luxury-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fade-in 0.3s ease-out;
      }

      :host-context(.dark) .loading-overlay {
        background: rgba(15, 23, 42, 0.85); /* Dark slate background */
      }

      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .luxury-spinner {
        width: 54px;
        height: 54px;
        border: 2px solid rgba(26, 26, 26, 0.1);
        border-top: 2px solid #1a1a1a;
        border-radius: 50%;
        animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }

      :host-context(.dark) .luxury-spinner {
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top: 2px solid #ffffff;
      }

      .loading-text {
        font-family: "Inter", sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #1a1a1a;
        animation: pulse 2s ease-in-out infinite;
      }

      :host-context(.dark) .loading-text {
        color: #ffffff;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  readonly loadingService = inject(LoadingService);
}
