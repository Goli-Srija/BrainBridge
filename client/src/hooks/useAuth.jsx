import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const { user: u } = await api.get('/auth/me');
      setUser(u);
      return u;
    } catch {
      tokenStore.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Any 401 from the API (expired token) logs the user out.
  useEffect(() => {
    const onUnauthorized = () => { tokenStore.clear(); setUser(null); };
    window.addEventListener('bb:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bb:unauthorized', onUnauthorized);
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await api.post('/auth/login', { email, password });
    tokenStore.set(token);
    setUser(u);
    return u;
  };
  const register = async (payload) => {
    const { token, user: u } = await api.post('/auth/register', payload);
    tokenStore.set(token);
    setUser(u);
    return u;
  };
  const logout = () => { tokenStore.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
