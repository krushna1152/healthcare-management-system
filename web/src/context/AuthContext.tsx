import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string, fullName?: string) => Promise<{ verification_token?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const res = await api.get<User>('/auth/me');
    setUser(res.data);
  };

  useEffect(() => {
    if (token) {
      fetchMe()
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      { email, password }
    );
    const { access_token } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    const me = await api.get<User>('/auth/me');
    setUser(me.data);
  };

  const register = async (
    email: string,
    password: string,
    role = 'patient',
    fullName?: string
  ) => {
    const res = await api.post<{ access_token: string; verification_token?: string }>(
      '/auth/register',
      { email, password, role, full_name: fullName || null }
    );
    const { access_token, verification_token } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    const me = await api.get<User>('/auth/me');
    setUser(me.data);
    return { verification_token };
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
