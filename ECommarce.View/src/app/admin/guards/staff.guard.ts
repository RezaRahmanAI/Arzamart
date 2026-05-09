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

      if (user.role === 'SuperAdmin' || user.role === 'Admin') {
        return true;
      }

      if (user.role === 'Staff') {
        const requiredMenu = route.data['menuKey'];
        if (!requiredMenu) {
          // If no menuKey is specified, we assume it's allowed (e.g. dashboard, profile, logout)
          return true;
        }

        if (user.allowedMenus && user.allowedMenus.includes(requiredMenu)) {
          return true;
        }

        notification.warn("You do not have permission to access this area.");
        return router.createUrlTree(['/admin/dashboard']);
      }

      return router.createUrlTree(['/login']);
    })
  );
};
