import { Component, OnInit, OnDestroy, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common"; 
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
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    if (this.mainSlides.length <= 1) return;
    
    // 5000ms / 50ms = 100 steps
    const step = 100 / (5000 / 50);
    
    this.timer = setInterval(() => {
      this.slideProgress += step;
      if (this.slideProgress >= 100) {
        this.next();
        this.slideProgress = 0;
      }
    }, 50);
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
  }

  prev() {
    this.direction = "prev";
    this.currentSlide =
      (this.currentSlide - 1 + this.mainSlides.length) % this.mainSlides.length;
    this.slideProgress = 0;
  }

  goTo(index: number) {
    this.direction = index > this.currentSlide ? "next" : "prev";
    this.currentSlide = index;
    this.slideProgress = 0;
    this.stopTimer();
    this.startTimer();
  }
}
