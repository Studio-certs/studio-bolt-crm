export type Role = 'admin' | 'user';
export type SuperRole = 'manager' | 'supervisor' | 'team_lead' | 'superadmin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  super_role: SuperRole;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}