import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  role: string | null;
  currentUser: string | null;
  isRegistered: boolean;
  login: (token: string, role: string, username: string) => void;
  logout: () => void;
  checkRegistration: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('admin_role'));
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('admin_username'));
  const [isRegistered, setIsRegistered] = useState<boolean>(true);

  const checkRegistration = async () => {
    try {
      const res = await axios.get('http://localhost:8080/auth/status');
      setIsRegistered(res.data.registered);
    } catch (err) {
      console.error('Failed to check auth status', err);
    }
  };

  useEffect(() => {
    checkRegistration();
  }, []);

  const login = (newToken: string, newRole: string, username: string) => {
    setToken(newToken);
    setRole(newRole);
    setCurrentUser(username);
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_role', newRole);
    localStorage.setItem('admin_username', username);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setCurrentUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_username');
  };

  return (
    <AuthContext.Provider value={{ token, role, currentUser, isRegistered, login, logout, checkRegistration }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
