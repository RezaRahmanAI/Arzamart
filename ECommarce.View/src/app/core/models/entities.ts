export interface User {
  id: string;
  fullName: string;
  name?: string; // For backward compatibility
  email: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe: boolean;
}
