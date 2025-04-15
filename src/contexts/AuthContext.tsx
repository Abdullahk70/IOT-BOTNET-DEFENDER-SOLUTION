import React, { createContext, useState, useEffect, useContext } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const defaultContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token and user on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        // If parsing fails, clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // Login function
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Value object for the context provider
  const contextValue: AuthContextType = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
