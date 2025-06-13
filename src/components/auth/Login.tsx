"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Add type for form data
type LoginFormData = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth(); // ✅ Get setUser from auth context
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        new URLSearchParams({
          username: data.username,
          password: data.password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const token = res.data.access_token;

      // ✅ Store in both localStorage and cookie
      localStorage.setItem("access_token", token);
      Cookies.set("token", token, { expires: 1 }); // important for middleware

      // ✅ Decode and set user in context
      const decoded: any = jwtDecode(token);
      setUser({
        id: parseInt(decoded.sub),
        username: decoded.username ?? "", // fallback to empty string
        role: decoded.role,
      });

      router.push("/employee/dashboard");
    } catch (err) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 bg-white p-6 shadow rounded"
      >
        <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
        <Input
          placeholder="اسم المستخدم"
          {...register("username", { required: "اسم المستخدم مطلوب" })}
        />
        {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}

        <Input
          type="password"
          placeholder="كلمة المرور"
          {...register("password", { required: "كلمة المرور مطلوبة" })}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "...جاري الدخول" : "تسجيل الدخول"}
        </Button>
      </form>
    </div>
  );
}
