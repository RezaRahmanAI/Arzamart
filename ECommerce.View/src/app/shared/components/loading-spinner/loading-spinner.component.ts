import { Component, inject } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { LoadingService } from "../../../core/services/loading.service";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (loadingService.loading$ | async) {
      <div class="loading-overlay" aria-live="polite" role="status">
        <div class="spinner-container">
          <div class="luxury-spinner"></div>
          <div class="loading-text">Loading...</div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--color-bg);
        opacity: 0.8;
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn var(--duration-slow) var(--ease-out);
      }

      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-5);
      }

      .luxury-spinner {
        width: 54px;
        height: 54px;
        border: 2px solid var(--color-border);
        opacity: 0.3;
        border-top: 2px solid var(--color-text);
        border-radius: 50%;
        animation: spin 1s var(--ease-default) infinite;
      }

      .loading-text {
        font-family: "Montserrat", sans-serif;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--color-text);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  readonly loadingService = inject(LoadingService);
}
