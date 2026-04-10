import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface UserProfile {
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

  getProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>("/profile");
  }

  updateProfile(data: UpdateProfileRequest): Observable<any> {
    return this.api.put("/profile", data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.api.post("/profile/change-password", data);
  }
}
