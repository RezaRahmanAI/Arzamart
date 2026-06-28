import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { map, take } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/entities';

export const staffGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  return authService.currentUser.pipe(
    take(1),
    map((user: User | null) => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      const role = user.role;
      const isSuperAdmin = role === 'SuperAdmin';

      if (isSuperAdmin) {
        return true;
      }

      if (role && role !== 'Customer') {
        const requiredMenu = route.data['menuKey'];
        if (!requiredMenu) {
          return true;
        }

        // Check direct slug match (old format)
        if (user.allowedMenus && user.allowedMenus.includes(requiredMenu)) {
          return true;
        }

        // Check permission ID match (new format: "inventory:view", "sales:create", etc.)
        const SLUG_TO_MODULE: Record<string, string> = {
          'products': 'inventory',
          'orders': 'sales',
          'customers': 'hr',
          'analytics': 'reports',
          'settings': 'settings',
          'users': 'staff-management',
        };
        const moduleId = SLUG_TO_MODULE[requiredMenu];
        if (moduleId && user.allowedMenus && user.allowedMenus.some(p => p.startsWith(moduleId + ':'))) {
          return true;
        }

        notification.warn("You do not have permission to access this area.");
        return router.createUrlTree(['/admin/dashboard']);
      }

      return router.createUrlTree(['/login']);
    })
  );
};
