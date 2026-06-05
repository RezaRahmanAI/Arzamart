import { NgIf, NgClass, DatePipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StaffService, AuditLogDto, StaffUserDto } from "../../services/staff.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-staff-audit-log",
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, FormsModule, AppIconComponent, NgFor],
  templateUrl: "./staff-audit-log.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffAuditLogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private staffService = inject(StaffService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  auditLogs: AuditLogDto[] = [];
  staffMembers: StaffUserDto[] = [];

  // Filtering & Pagination
  selectedActorId = "";
  searchAction = "";
  startDate = "";
  endDate = "";
  page = 1;
  pageSize = 20;
  totalCount = 0;

  isLoading = false;
  expandedLogId: string | null = null;

  ngOnInit(): void {
    this.loadStaffList();
    this.loadLogs();
  }

  loadStaffList(): void {
    // Fetch all staff users for the actor filter dropdown
    this.staffService.getStaffUsers({ pageSize: 100 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.staffMembers = res.data.items;
        this.cdr.markForCheck();
      }
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.staffService.getAuditLogs({
      actorId: this.selectedActorId || undefined,
      action: this.searchAction || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.page,
      pageSize: this.pageSize
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.auditLogs = res.data.items;
        this.totalCount = res.data.totalCount;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.notification.error("Failed to load audit trail.");
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadLogs();
  }

  resetFilters(): void {
    this.selectedActorId = "";
    this.searchAction = "";
    this.startDate = "";
    this.endDate = "";
    this.page = 1;
    this.loadLogs();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadLogs();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  toggleExpand(logId: string): void {
    if (this.expandedLogId === logId) {
      this.expandedLogId = null;
    } else {
      this.expandedLogId = logId;
    }
  }

  formatDetailsJson(details: string | undefined): string {
    if (!details) return "{}";
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  }

  getActionBadgeClass(action: string): string {
    if (action.includes("CREATE")) return "badge-success border-emerald-200 text-emerald-700 bg-emerald-50";
    if (action.includes("DELETE")) return "badge-danger border-red-200 text-red-700 bg-red-50";
    if (action.includes("PASSWORD")) return "badge-warning border-amber-200 text-amber-700 bg-amber-50";
    if (action.includes("UPDATE")) return "badge-default border-blue-200 text-blue-700 bg-blue-50";
    return "badge-default border-slate-200 text-slate-700 bg-slate-50";
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
