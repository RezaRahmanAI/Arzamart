import { Component, OnInit, OnDestroy, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common"; // Import CommonModule for structural directives
import { RouterModule } from "@angular/router"; // Import RouterModule for routerLink
import { trigger, transition, style, animate } from "@angular/animations";
import { ImageUrlService } from "../../../../core/services/image-url.service";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
}

import { LucideAngularModule, ArrowRight, ArrowLeft } from "lucide-angular";

@Component({
  selector: "app-hero",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./hero.component.html",
  styleUrl: "./hero.component.css",
  animations: [
    trigger("fade", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate("800ms ease-in-out", style({ opacity: 1 })),
      ]),
      transition(":leave", [
        animate("800ms ease-in-out", style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class HeroComponent implements OnInit, OnDestroy {
  readonly icons = {
    ArrowRight,
    ArrowLeft,
  };
  private imageUrlService = inject(ImageUrlService);

  @Input() slides: Slide[] = [];

  currentSlide = 0;
  timer: any;
  currentYear = new Date().getFullYear();

  ngOnInit() {
    if (this.slides.length > 0) {
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  next() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prev() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goTo(index: number) {
    this.currentSlide = index;
    this.stopTimer();
    this.startTimer();
  }
}
