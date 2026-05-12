import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  isRegistered: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkRegistration: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isRegistered, setIsRegistered] = useState<boolean>(true);

  const checkRegistration = async () => {
    try {
      const res = await axios.get('http://localhost:3000/auth/status');
      setIsRegistered(res.data.registered);
    } catch (err) {
      console.error('Failed to check auth status', err);
    }
  };

  useEffect(() => {
    checkRegistration();
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('admin_token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ token, isRegistered, login, logout, checkRegistration }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
