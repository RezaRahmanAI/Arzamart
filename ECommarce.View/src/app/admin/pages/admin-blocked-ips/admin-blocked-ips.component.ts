import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from "@angular/forms";
import {
  AdminSecurityService,
  BlockedIp,
} from "../../services/admin-security.service";
import { LucideAngularModule, Ban } from "lucide-angular";

@Component({
  selector: "app-admin-blocked-ips",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-blocked-ips.component.html",
})
export class AdminBlockedIpsComponent implements OnInit {
  readonly icons = {
    Ban,
  };
  private securityService = inject(AdminSecurityService);
  private fb = inject(FormBuilder);

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
    this.securityService.getBlockedIps().subscribe({
      next: (data) => {
        this.blockedIps = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load blocked IPs", err);
        this.isLoading = false;
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

      this.securityService.blockIp(data).subscribe({
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
      this.securityService.unblockIp(id).subscribe({
        next: () => {
          this.loadBlockedIps();
        },
        error: (err) => {
          console.error("Failed to unblock IP", err);
        },
      });
    }
  }
}
