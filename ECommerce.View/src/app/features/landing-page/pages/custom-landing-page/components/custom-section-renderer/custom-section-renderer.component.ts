import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingSection, CustomField } from '../../../../../../core/models/landing-page';
import { ImageUrlService } from '../../../../../../core/services/image-url.service';
import { SafeHtmlPipe } from '../../../../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-custom-section-renderer',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './custom-section-renderer.component.html',
  styleUrl: './custom-section-renderer.component.css'
})
export class CustomSectionRendererComponent {
  @Input({ required: true }) section!: LandingSection;
  @Input() scrollToOrder: () => void = () => {};

  private readonly imageUrlService = inject(ImageUrlService);

  getField(key: string): CustomField | undefined {
    return this.section.customFields?.find(f => f.key === key && f.enabled);
  }

  getFieldValue(key: string): string {
    return this.getField(key)?.value || '';
  }

  getImageUrl(url: string): string {
    return this.imageUrlService.getImageUrl(url);
  }

  getImagesList(): string[] {
    const field = this.getField('images');
    if (!field || !Array.isArray(field.value)) return [];
    return field.value.filter((url: string) => url && url.trim().length > 0);
  }

  getFeatures(): string[] {
    const text = this.getFieldValue('features');
    if (!text) return [];
    return text.split('\n').filter((line: string) => line.trim().length > 0);
  }

  onButtonClick(): void {
    if (this.scrollToOrder) {
      this.scrollToOrder();
    }
  }
}
