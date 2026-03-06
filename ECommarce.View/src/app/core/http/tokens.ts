import { HttpContextToken } from "@angular/common/http";

/**
 * HttpContextToken to signal interceptors to bypass global error logging/notifications.
 * Useful for background checks, startup refreshes, etc.
 */
export const BYPASS_LOGGING = new HttpContextToken<boolean>(() => false);
