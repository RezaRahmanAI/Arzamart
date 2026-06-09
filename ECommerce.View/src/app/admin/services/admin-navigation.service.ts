import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface NavigationMenuItem {
  id: number;
  name: string;
  link: string;
  parentMenuId?: number | null;
  displayOrder: number;
  isActive: boolean;
  childMenus?: NavigationMenuItem[];
}

@Injectable({
  providedIn: "root",
})
export class AdminNavigationService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/navigation";

  getAll(): Observable<NavigationMenuItem[]> {
    return this.api.get<NavigationMenuItem[]>(this.baseUrl);
  }

  getById(id: number): Observable<NavigationMenuItem> {
    return this.api.get<NavigationMenuItem>(`${this.baseUrl}/${id}`);
  }

  create(menu: Partial<NavigationMenuItem>): Observable<NavigationMenuItem> {
    return this.api.post<NavigationMenuItem>(this.baseUrl, menu);
  }

  update(
    id: number,
    menu: Partial<NavigationMenuItem>,
  ): Observable<NavigationMenuItem> {
    return this.api.post<NavigationMenuItem>(`${this.baseUrl}/${id}`, menu);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
