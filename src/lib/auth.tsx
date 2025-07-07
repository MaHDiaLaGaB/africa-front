"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

export type UserType = {
  id: number;
  username: string;
  full_name?: string;
  role: "admin" | "employee";
};

type AuthContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      try {
        // Optional: verify token integrity client-side
        const decoded: any = jwtDecode(token);
        if (!decoded.sub) throw new Error("Invalid token");

        // Fetch full user info from backend
        const res = await api.get<UserType>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(res.data);
      } catch (err) {
        console.error('Auth init failed:', err);
        localStorage.removeItem("access_token");
        setUser(null);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);


  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
