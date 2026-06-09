import { NgIf, DatePipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from "@angular/forms";
import {
  SecurityService,
  BlockedIp,
} from "../../services/security.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-admin-blocked-ips",
  standalone: true,
  imports: [NgIf, DatePipe, ReactiveFormsModule, FormsModule, AppIconComponent, NgFor],
  templateUrl: "./blocked-ips.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockedIpsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private securityService = inject(SecurityService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  blockedIps: BlockedIp[] = [];
  isLoading = false;

  blockForm = this.fb.group({
    ipAddress: [
      "",
      [
        Validators.required,
        Validators.pattern(
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        ),
      ],
    ],
    reason: [""],
  });

  ngOnInit(): void {
    this.loadBlockedIps();
  }

  loadBlockedIps(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.securityService.getBlockedIps().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.blockedIps = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Failed to load blocked IPs", err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.blockForm.valid) {
      const formValue = this.blockForm.value;
      const data: Partial<BlockedIp> = {
        ipAddress: formValue.ipAddress!,
        reason: formValue.reason || undefined,
      };

      this.securityService.blockIp(data).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadBlockedIps();
          this.blockForm.reset();
        },
        error: (err) => {
          alert(err.error || "Failed to block IP");
        },
      });
    }
  }

  unblockIp(id: number): void {
    if (confirm("Are you sure you want to unblock this IP?")) {
      this.securityService.unblockIp(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadBlockedIps();
        },
        error: (err) => {
          console.error("Failed to unblock IP", err);
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
