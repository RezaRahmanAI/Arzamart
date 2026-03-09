export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
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
