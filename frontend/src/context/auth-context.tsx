"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { StudentDTO } from "@/lib/types";
import { getMyProfile } from "@/lib/api";

interface AuthContextType {
  user: StudentDTO | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudentDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        setUser(null);
        return;
      }
      const profile = await getMyProfile();
      setUser(profile);
    } catch {
      setUser(null);
      localStorage.removeItem("username");
      localStorage.removeItem("password");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === "ADMIN",
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
