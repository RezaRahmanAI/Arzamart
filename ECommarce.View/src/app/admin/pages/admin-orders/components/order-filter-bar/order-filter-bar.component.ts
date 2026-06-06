import { NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { OrdersQueryParams } from '../../../models/orders.models';
import { SourcePage } from '../../../core/models/order-source';
import { SocialMediaSource } from '../../../core/models/order-source';
import { AppIconComponent } from '../../../../../shared/components/app-icon/app-icon.component';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-order-filter-bar',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, AppIconComponent],
  templateUrl: './order-filter-bar.component.html',
})
export class OrderFilterBarComponent implements OnDestroy {
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  @Input() selectedStatus: OrdersQueryParams['status'] = 'All';
  @Input() selectedDateRange: OrdersQueryParams['dateRange'] = 'Last 30 Days';
  @Input() selectedOrderType: 'All' | 'PreOrder' | 'Website' | 'Manual' = 'All';
  @Input() selectedSourcePageId: number | null = null;
  @Input() selectedSocialMediaSourceId: number | null = null;
  @Input() selectedSourcePageLabel: string = 'Sources';
  @Input() sourcePages: SourcePage[] = [];
  @Input() socialMediaSources: SocialMediaSource[] = [];
  @Input() dateRanges: OrdersQueryParams['dateRange'][] = [
    'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Year', 'All Time'
  ];

  @Output() statusChange = new EventEmitter<OrdersQueryParams['status']>();
  @Output() dateRangeChange = new EventEmitter<OrdersQueryParams['dateRange']>();
  @Output() orderTypeChange = new EventEmitter<'All' | 'PreOrder' | 'Website' | 'Manual'>();
  @Output() sourcePageChange = new EventEmitter<number | null>();
  @Output() socialMediaChange = new EventEmitter<number | null>();
  @Output() customRangeApply = new EventEmitter<{ start: string; end: string }>();
  @Output() search = new EventEmitter<{ orderId: string; phone: string }>();

  statusOptions: OrdersQueryParams['status'][] = [
    'All', 'Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 
    'Delivered', 'Cancelled', 'Hold', 'Return', 'Exchange', 'ReturnProcess', 'Refund', 'PreOrder'
  ];

  statusMenuOpen = false;
  dateMenuOpen = false;
  sourceMenuOpen = false;
  customStartDate: string | null = null;
  customEndDate: string | null = null;
  tempStartDate: string | null = null;
  tempEndDate: string | null = null;

  orderIdSearchControl = new FormControl('', { nonNullable: true });
  phoneSearchControl = new FormControl('', { nonNullable: true });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeDateRangeLabel(): string {
    if (this.selectedDateRange === 'Custom' && this.customStartDate && this.customEndDate) {
      const start = new Date(this.customStartDate);
      const end = new Date(this.customEndDate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }
    return this.selectedDateRange;
  }

  get selectedSourceLabel(): string {
    if (this.selectedSourcePageId) {
      const page = this.sourcePages.find(p => p.id === this.selectedSourcePageId);
      return page ? page.name : 'Page';
    }
    if (this.selectedSocialMediaSourceId) {
      const source = this.socialMediaSources.find(s => s.id === this.selectedSocialMediaSourceId);
      return source ? source.name : 'Social';
    }
    return 'Sources';
  }

  trackByStatusOption(_: number, status: string): string {
    return status;
  }

  trackByDateRange(_: number, range: string): string {
    return range;
  }

  trackBySourcePage(_: number, page: SourcePage): number {
    return page.id;
  }

  trackBySocialMediaSource(_: number, source: SocialMediaSource): number {
    return source.id;
  }

  onOrderIdSearch(): void {
    this.search.emit({ orderId: this.orderIdSearchControl.value, phone: this.phoneSearchControl.value });
  }

  onPhoneSearch(): void {
    this.search.emit({ orderId: this.orderIdSearchControl.value, phone: this.phoneSearchControl.value });
  }

  toggleStatusMenu(event: Event): void {
    event.stopPropagation();
    this.statusMenuOpen = !this.statusMenuOpen;
    this.dateMenuOpen = false;
  }

  toggleDateMenu(event: Event): void {
    event.stopPropagation();
    this.dateMenuOpen = !this.dateMenuOpen;
    this.statusMenuOpen = false;
  }

  toggleSourceMenu(event: Event): void {
    event.stopPropagation();
    this.sourceMenuOpen = !this.sourceMenuOpen;
    this.statusMenuOpen = false;
    this.dateMenuOpen = false;
  }

  setStatusFilter(status: OrdersQueryParams['status'], event: Event): void {
    event.stopPropagation();
    this.statusMenuOpen = false;
    this.statusChange.emit(status);
  }

  setDateRange(range: OrdersQueryParams['dateRange'], event: Event): void {
    event.stopPropagation();
    this.selectedDateRange = range;
    if (range !== 'Custom') {
      this.customStartDate = null;
      this.customEndDate = null;
    }
    this.dateMenuOpen = false;
    this.dateRangeChange.emit(range);
  }

  applyCustomRange(event: Event): void {
    event.stopPropagation();
    if (this.tempStartDate && this.tempEndDate) {
      this.customStartDate = this.tempStartDate;
      this.customEndDate = this.tempEndDate;
      this.selectedDateRange = 'Custom';
      this.dateMenuOpen = false;
      this.customRangeApply.emit({ start: this.tempStartDate, end: this.tempEndDate });
    }
  }

  setOrderTypeFilter(type: 'All' | 'PreOrder' | 'Website' | 'Manual'): void {
    this.orderTypeChange.emit(type);
  }

  setSourcePageFilter(id: number | null): void {
    this.sourcePageChange.emit(id);
    this.sourceMenuOpen = false;
  }

  setSocialMediaFilter(id: number | null): void {
    this.socialMediaChange.emit(id);
    this.sourceMenuOpen = false;
  }
}

import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';