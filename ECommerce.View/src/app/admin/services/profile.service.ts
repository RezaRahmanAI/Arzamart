import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface AdminUserProfile {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  userName?: string;
  phone?: string;
  currentPassword?: string;
}

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  private readonly api = inject(ApiHttpClient);

  getProfile(): Observable<AdminUserProfile> {
    return this.api.get<AdminUserProfile>("/profile");
  }

  updateProfile(data: UpdateProfileRequest): Observable<any> {
    return this.api.put("/profile", data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.api.post("/profile/change-password", data);
  }
}
