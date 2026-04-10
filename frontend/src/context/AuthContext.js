import { createContext, useState, useContext, useEffect } from 'react';
import { logoutUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); //true until localStorage checked

  //restore session from localStorage 
  useEffect(() => {
    const storedUser = localStorage.getItem('bme_user');
    const storedToken = localStorage.getItem('bme_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('bme_user');
        localStorage.removeItem('bme_token');
      }
    }
    setLoading(false);
  }, []);

  //after successful login or signup
  const login = (userData, token) => {
    localStorage.setItem('bme_token', token);
    localStorage.setItem('bme_user', JSON.stringify(userData));
    setUser(userData);
  };

  //on logout clears everything
  const logout = async () => {
    try {
      await logoutUser(); //notify backend if needed
    } catch (_) {
    }
    localStorage.removeItem('bme_token');
    localStorage.removeItem('bme_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{user,login,logout,loading,
        isAuthenticated: !!user,
        role: user?.role || null, //'customer' | 'business' | 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
export default AuthContext;
