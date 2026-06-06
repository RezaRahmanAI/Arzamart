export interface User {
  id: string;
  fullName: string;
  userName: string;
  name?: string; // For backward compatibility
  email: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
  allowedMenus?: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  forceChangePassword?: boolean;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe: boolean;
}
