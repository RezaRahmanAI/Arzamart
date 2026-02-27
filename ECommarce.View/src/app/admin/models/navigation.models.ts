export interface AdminNavigationMenu {
  id: number;
  name: string;
  link: string;
  parentMenuId?: number | null;
  displayOrder: number;
  isActive: boolean;
  childMenus?: AdminNavigationMenu[];
}

export interface NavigationMenuCreatePayload {
  name: string;
  link: string;
  parentMenuId?: number | null;
  displayOrder: number;
  isActive: boolean;
}
