"use client";

import React, { createContext, useContext, useEffect, useState } from "react"

type AuthContextType = {
  token: string | null
  setToken: (token: string | null) => void
  isLoggedIn: boolean
  logout: () => void
  setRole: (role: string | null) => void
  role: string | null
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isLoggedIn: false,
  logout: () => {},
  setRole: () => {},
  role: null
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("access_token");
    if (storedToken) setTokenState(storedToken);

    const storedRole = sessionStorage.getItem("user_role");
    if (storedRole) setRoleState(storedRole);
  }, []);

  const setToken = (token: string | null) => {
    if (token) {
      sessionStorage.setItem("access_token", token);
    } else {
      sessionStorage.removeItem("access_token");
    }
    setTokenState(token);
  }

  const setRole = (role: string | null) => {
    if (role) {
      sessionStorage.setItem("user_role", role);
    } else {
      sessionStorage.removeItem("user_role");
    }
    setRoleState(role);
  }

  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_role");
    setTokenState(null);
    setRoleState(null);
  }

  return (
    <AuthContext.Provider value={{ token, setToken, isLoggedIn: !!token, logout, setRole, role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);