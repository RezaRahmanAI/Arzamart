import { Component, OnInit, OnDestroy, inject, Input, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
 
import { RouterModule } from "@angular/router"; 
import { trigger, transition, style, animate } from "@angular/animations";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
  type?: string;
}

@Component({
  selector: "app-hero",
  standalone: true,
  imports: [RouterModule, AppIconComponent],
  templateUrl: "./hero.component.html",
  styleUrl: "./hero.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideSlide", [
      transition(":enter", [
        style({ transform: "{{enterStart}}", opacity: 0 }),
        animate(
          "600ms cubic-bezier(0.4, 0, 0.2, 1)",
          style({ transform: "translateX(0)", opacity: 1 }),
        ),
      ], { params: { enterStart: 'translateX(100%)' } }),
      transition(":leave", [
        animate(
          "600ms cubic-bezier(0.4, 0, 0.2, 1)",
          style({ transform: "{{leaveEnd}}", opacity: 0 }),
        ),
      ], { params: { leaveEnd: 'translateX(-100%)' } }),
    ]),
  ],
})
export class HeroComponent implements OnInit, OnDestroy {
  public imageUrlService = inject(ImageUrlService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private _slides: Slide[] = [];
  @Input() 
  set slides(value: Slide[]) {
    this._slides = value || [];
    this.updateSlides();
  }
  get slides(): Slide[] {
    return this._slides;
  }
  spotlightSlide: Slide | null = null;
  mainSlides: Slide[] = [];

  currentSlide = 0;
  direction: "next" | "prev" = "next";
  slideProgress = 0;
  isPaused = false;
  timer: any;
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.updateSlides();
  }

  private updateSlides() {
    this.spotlightSlide = this._slides.find(s => s.type === 'Spotlight') || null;
    this.mainSlides = this._slides.filter(s => s.type === 'Hero' || !s.type);
    
    if (this.mainSlides.length > 0) {
      this.stopTimer();
      this.startTimer();
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private updateProgressBarDOM() {
    const progressBar = document.getElementById("hero-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${this.slideProgress}%`;
    }
  }

  startTimer() {
    if (this.mainSlides.length <= 1) return;
    this.stopTimer();
    
    // 5000ms / 16ms ≈ 312 steps
    const step = 100 / (5000 / 16);
    
    this.ngZone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.slideProgress += step;
          this.updateProgressBarDOM();
          if (this.slideProgress >= 100) {
            this.ngZone.run(() => { this.next(); });
            this.slideProgress = 0;
            this.updateProgressBarDOM();
          }
        }
      }, 16);
    });
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  next() {
    this.direction = "next";
    this.currentSlide = (this.currentSlide + 1) % this.mainSlides.length;
    this.slideProgress = 0;
    this.updateProgressBarDOM();
    this.cdr.markForCheck();
  }

  prev() {
    this.direction = "prev";
    this.currentSlide =
      (this.currentSlide - 1 + this.mainSlides.length) % this.mainSlides.length;
    this.slideProgress = 0;
    this.updateProgressBarDOM();
    this.cdr.markForCheck();
  }

  goTo(index: number) {
    this.direction = index > this.currentSlide ? "next" : "prev";
    this.currentSlide = index;
    this.slideProgress = 0;
    this.updateProgressBarDOM();
    this.stopTimer();
    this.startTimer();
    this.cdr.markForCheck();
  }
}
