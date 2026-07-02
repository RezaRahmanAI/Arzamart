import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CdkDragDrop, moveItemInArray, DragDropModule } from "@angular/cdk/drag-drop";
import { Product } from "../../../../../../core/models/product";
import { ImageUrlService } from "../../../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../../../shared/components/app-icon/app-icon.component";
import { LandingSection } from "../../../../../../core/models/landing-page";
import { AddComponentModalComponent } from "../add-component-modal/add-component-modal.component";
import { CustomSectionEditorComponent } from "../custom-section-editor/custom-section-editor.component";

@Component({
  selector: "app-custom-landing-page-editor",
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule,
    AppIconComponent, TitleCasePipe,
    AddComponentModalComponent, CustomSectionEditorComponent
  ],
  templateUrl: "./custom-landing-page-editor.component.html",
  styleUrl: "./custom-landing-page-editor.component.css"
})
export class CustomLandingPageEditorComponent {
  readonly imageUrlService = inject(ImageUrlService);

  @Input({ required: true }) configForm!: FormGroup;
  @Input({ required: true }) sections: LandingSection[] = [];
  @Input({ required: true }) allProducts: Product[] = [];
  @Input({ required: true }) defaultRelatedProducts: Product[] = [];
  @Input({ required: true }) isSaving = false;
  @Input({ required: true }) isProductSelectionLoading = false;
  @Input({ required: true }) isEditorOpen = false;
  @Input() primaryProductId?: number;

  @Output() save = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() closeEditor = new EventEmitter<void>();
  @Output() sectionsChange = new EventEmitter<LandingSection[]>();
  @Output() productSelectionToggled = new EventEmitter<number>();

  activeEditorSection = "global";
  productSearchTerm = "";
  isAddComponentModalOpen = false;

  toggleActiveSection(section: LandingSection): void {
    this.ensureSectionSettings(section);
    this.activeEditorSection = this.activeEditorSection === section.id ? "" : section.id;
  }

  moveSection(index: number, direction: "up" | "down"): void {
    if (direction === "up" && index > 0) {
      [this.sections[index], this.sections[index - 1]] = [this.sections[index - 1], this.sections[index]];
    } else if (direction === "down" && index < this.sections.length - 1) {
      [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
    }
    this.sections = [...this.sections];
    this.emitChange();
  }

  drop(event: CdkDragDrop<LandingSection[]>): void {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
    this.sections = [...this.sections];
    this.emitChange();
  }

  toggleVisibility(index: number): void {
    this.sections[index].visible = !this.sections[index].visible;
    this.sections = [...this.sections];
    this.emitChange();
  }

  deleteSection(index: number): void {
    if (confirm("Delete this section?")) {
      const deletedSection = this.sections[index];
      if (deletedSection && this.activeEditorSection === deletedSection.id) {
        this.activeEditorSection = "";
      }
      this.sections.splice(index, 1);
      this.sections = [...this.sections];
      this.emitChange();
    }
  }

  onComponentCreated(section: LandingSection): void {
    this.sections.push(section);
    this.sections = [...this.sections];
    this.emitChange();
    this.activeEditorSection = section.id;
  }

  getSectionIcon(section: LandingSection): string {
    if (section.icon) return section.icon;
    const iconMap: Record<string, string> = {
      'marquee': 'Megaphone',
      'countdown': 'Clock',
      'hero': 'Rocket',
      'product-hero': 'ShoppingBag',
      'discount-cta': 'Gift',
      'info-banner': 'Info',
      'trust-banner': 'ShieldCheck',
      'product-select': 'Package',
      'reviews': 'Star',
      'order-form': 'FileText',
    };
    return iconMap[section.type] || 'LayoutGrid';
  }

  get productsForSelectionPool(): Product[] {
    const pool = [...this.defaultRelatedProducts];

    if (this.productSearchTerm) {
      this.allProducts.forEach(p => {
        if (!pool.find(item => item.id === p.id)) {
          if (
            p.name.toLowerCase().includes(this.productSearchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(this.productSearchTerm.toLowerCase())
          ) {
            pool.push(p);
          }
        }
      });
    }

    return pool;
  }

  toggleProductSelection(productId: number): void {
    this.productSelectionToggled.emit(productId);
  }

  isProductInCustomSelection(productId: number): boolean {
    const section = this.sections.find(s => s.type === "product-select");
    return section?.settings?.customProductIds?.includes(productId) || false;
  }

  ensureSectionSettings(section: LandingSection): void {
    if (!section.settings) section.settings = {};
    const s = section.settings;
    const form = this.configForm.value;

    if (section.type === "countdown") {
      if (s.isTimerVisible === undefined) s.isTimerVisible = form.isTimerVisible !== undefined ? form.isTimerVisible : true;
      if (s.headerTitle === undefined) s.headerTitle = form.headerTitle || "অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!";
      if (s.relativeTimerTotalMinutes === undefined)
        s.relativeTimerTotalMinutes = form.relativeTimerTotalMinutes !== undefined ? form.relativeTimerTotalMinutes : null;
    } else if (section.type === "hero") {
      if (s.heroTitle === undefined) s.heroTitle = form.heroTitle || "একচেটিয়া অফার! আজকের জন্যই সেরা সুযোগ";
      if (s.heroSubtitle === undefined) s.heroSubtitle = form.heroSubtitle || "প্রিমিয়াম কোয়ালিটি এখন সাশ্রয়ী মূল্যে";
      if (s.heroBadge === undefined) s.heroBadge = form.heroBadge || "স্টক ফুরিয়ে যাওয়ার আগেই সংগ্রহ করুন";
    } else if (section.type === "product-hero") {
      if (s.productHeroTitle === undefined) s.productHeroTitle = form.productHeroTitle || "আমাদের প্রিমিয়াম প্রসাধনী";
      if (s.productHeroDescription === undefined) s.productHeroDescription = form.productHeroDescription || "সেরা উপাদান দিয়ে তৈরি যা আপনার ত্বকের যত্ন নেবে।";
    } else if (section.type === "discount-cta") {
      if (s.discountCtaTitle === undefined) s.discountCtaTitle = form.discountCtaTitle || "অবিশ্বাস্য ডিসকাউন্ট অফার!";
      if (s.discountCtaDescription === undefined) s.discountCtaDescription = form.discountCtaDescription || "আজই অর্ডার করলে পাবেন বিশেষ ছাড় এবং ফ্রি ডেলিভারি।";
    } else if (section.type === "info-banner") {
      if (s.infoBannerTitle === undefined) s.infoBannerTitle = form.infoBannerTitle || "প্রোডাক্ট ব্যবহারের নিয়মাবলী";
      if (s.infoBannerDescription === undefined) s.infoBannerDescription = form.infoBannerDescription || "প্রতিদিন সকালে ও রাতে পরিষ্কার ত্বকে অল্প পরিমাণে ক্রিম লাগিয়ে আলতোভাবে ম্যাসাজ করুন।";
    } else if (section.type === "trust-banner") {
      if (s.isTrustBannerVisible === undefined) s.isTrustBannerVisible = form.isTrustBannerVisible !== undefined ? form.isTrustBannerVisible : true;
      if (s.trustBannerText === undefined) s.trustBannerText = form.trustBannerText || "দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই";
    } else if (section.type === "reviews") {
      if (s.isReviewsVisible === undefined) s.isReviewsVisible = form.isReviewsVisible !== undefined ? form.isReviewsVisible : true;
    } else if (section.type === "marquee") {
      if (s.marqueeText === undefined) s.marqueeText = form.marqueeText || '';
    }
  }

  emitChange(): void {
    this.sectionsChange.emit(this.sections);
  }
}
