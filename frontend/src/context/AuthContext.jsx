import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { extractError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('securepay_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => {
        localStorage.removeItem('securepay_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (data) => {
    localStorage.setItem('securepay_token', data.token);
    setUser(data.user);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login: async (payload) => {
        const res = await authApi.login(payload);
        persist(res.data.data);
        return res.data.data.user;
      },
      register: async (payload) => {
        const res = await authApi.register(payload);
        persist(res.data.data);
        return res.data.data.user;
      },
      logout: () => {
        localStorage.removeItem('securepay_token');
        setUser(null);
      },
      refresh: async () => {
        const res = await authApi.me();
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      setUser,
      extractError,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
