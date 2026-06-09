import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface BlockedIp {
  id: number;
  ipAddress: string;
  reason?: string;
  blockedAt: string;
  blockedBy?: string;
}

@Injectable({
  providedIn: "root",
})
export class AdminSecurityService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/security";

  getBlockedIps(): Observable<BlockedIp[]> {
    return this.api.get<BlockedIp[]>(`${this.baseUrl}/blocked-ips`);
  }

  blockIp(blockedIp: Partial<BlockedIp>): Observable<BlockedIp> {
    return this.api.post<BlockedIp>(`${this.baseUrl}/block-ip`, blockedIp);
  }

  unblockIp(id: number): Observable<any> {
    return this.api.delete(`${this.baseUrl}/unblock-ip/${id}`);
  }
}
