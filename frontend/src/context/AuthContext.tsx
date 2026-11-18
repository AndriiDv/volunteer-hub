import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role: 'volunteer' | 'military';
    unit_name?: string;
  }) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtFallback(token: string): Partial<User> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return {
      id: Number(decoded.sub || decoded.user_id || 0),
      email: decoded.email || '',
      full_name: decoded.full_name || decoded.name || decoded.email || 'Користувач',
      role: decoded.role || 'volunteer',
      unit_name: decoded.unit_name,
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('vh_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncUserProfile = async (jwtToken: string, providedUser?: User) => {
    localStorage.setItem('vh_token', jwtToken);
    setToken(jwtToken);

    if (providedUser) {
      localStorage.setItem('vh_user', JSON.stringify(providedUser));
      setUser(providedUser);
      return;
    }

    try {
      const me = await api.getMe();
      localStorage.setItem('vh_user', JSON.stringify(me));
      setUser(me);
    } catch {
      const fallback = parseJwtFallback(jwtToken);
      if (fallback && fallback.email) {
        const u = fallback as User;
        localStorage.setItem('vh_user', JSON.stringify(u));
        setUser(u);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (token) {
        await syncUserProfile(token, user || undefined);
      }
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await syncUserProfile(res.access_token, res.user);
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: 'volunteer' | 'military';
    unit_name?: string;
  }) => {
    const res = await api.register(payload);
    if (res.access_token) {
      await syncUserProfile(res.access_token, res.user);
    } else {
      await login(payload.email, payload.password);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.googleLogin(credential);
    await syncUserProfile(res.access_token, res.user);
  };

  const logout = () => {
    localStorage.removeItem('vh_token');
    localStorage.removeItem('vh_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
