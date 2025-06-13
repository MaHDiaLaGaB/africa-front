"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

export type UserType = {
  id: number;
  username: string;
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
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (!decoded.sub || !decoded.role) throw new Error("Invalid token");

          setUser({
            id: parseInt(decoded.sub),
            username: decoded.username ?? "",
            role: decoded.role,
          });
        } catch (err) {
          localStorage.removeItem("access_token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 🟢 WebSocket للإشعارات الحية
  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/${user.id}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      toast.info(`🔔 ${data.content}`);
    };

    ws.onerror = () => toast.error("فشل في الاتصال بالإشعارات الحية");
    ws.onclose = () => console.log("🔌 WebSocket disconnected");

    return () => ws.close();
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
