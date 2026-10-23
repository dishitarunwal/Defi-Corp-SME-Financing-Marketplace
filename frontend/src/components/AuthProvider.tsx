import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authAPI, ApiError } from '../services/api';
import { AuthContext } from '../context/auth';
import type { AuthContextValue } from '../context/auth';
import type { Profile, SignupData, User } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      setProfile(response.data.profile);
    } catch (error) {
      // Only drop the session if the token itself was rejected
      if (error instanceof ApiError && error.status === 401) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (authAPI.isAuthenticated()) {
        await refreshProfile();
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, [refreshProfile]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const response = await authAPI.login(credentials);
    setUser(response.data.user);
    setProfile(response.data.profile);
    return response.data;
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const response = await authAPI.signup(data);
    setUser(response.data.user);
    setProfile(response.data.profile);
    return response.data;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    refreshProfile
  }), [user, profile, loading, login, signup, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
