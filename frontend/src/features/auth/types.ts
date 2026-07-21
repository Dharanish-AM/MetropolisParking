export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'CUSTOMER';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
