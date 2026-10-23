import { createContext, useContext } from 'react';
import type { AuthPayload, Profile, SignupData, User } from '../types';

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthPayload>;
  signup: (data: SignupData) => Promise<AuthPayload>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
