import { NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { OrdersQueryParams } from '../../../../models/orders.models';
import { SourcePage } from '../../../../../core/models/order-source';
import { SocialMediaSource } from '../../../../../core/models/order-source';
import { AppIconComponent } from '../../../../../shared/components/app-icon/app-icon.component';
import { NotificationService } from '../../../../../core/services/notification.service';
import { SourceManagementService } from '../../../../../core/services/source-management.service';

@Component({
  selector: 'app-order-filter-bar',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, AppIconComponent],
  templateUrl: './order-filter-bar.component.html',
})
export class OrderFilterBarComponent implements OnDestroy {
  private sourceService = inject(SourceManagementService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  @Input() currentStatus: 'All' | string = 'All';
  @Input() statusOptions: ('All' | string)[] = [];
  @Input() sourcePages: SourcePage[] = [];
  @Input() socialMediaSources: SocialMediaSource[] = [];
  @Input() dateRangeOptions: string[] = [];
  @Input() currentDateRange: string = 'All Time';

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() dateRangeChange = new EventEmitter<string>();
  @Output() sourcePageChange = new EventEmitter<number | null>();
  @Output() socialMediaChange = new EventEmitter<number | null>();

  searchControl = new FormControl('');
  sourceMenuOpen = false;
  socialMenuOpen = false;
  selectedSourcePage: SourcePage | null = null;
  selectedSocialMedia: SocialMediaSource | null = null;

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.searchChange.emit(value ?? '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStatusChange(status: string): void {
    this.statusChange.emit(status);
  }

  onDateRangeChange(range: string): void {
    this.dateRangeChange.emit(range);
  }

  setSourcePage(sourcePage: SourcePage | null): void {
    this.selectedSourcePage = sourcePage;
    this.sourcePageChange.emit(sourcePage?.id ?? null);
    this.sourceMenuOpen = false;
  }

  setSocialMediaSource(source: SocialMediaSource | null): void {
    this.selectedSocialMedia = source;
    this.socialMediaChange.emit(source?.id ?? null);
    this.socialMenuOpen = false;
  }
}
