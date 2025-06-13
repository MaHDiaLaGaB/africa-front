"use client";

import { useForm } from "react-hook-form";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Add type for form data
type RegisterFormData = {
  username: string;
  full_name: string;
  password: string;
};

export default function RegisterPage() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegisterFormData>(); // Add generic type to useForm
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // Update state type
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => { // Add type annotation
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, 
        {
          username: data.username,
          full_name: data.full_name,
          password: data.password
        }
      );
      setMessage("✅ تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن");
      router.push("/auth/login");
    } catch (err) {
      setMessage("❌ حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 bg-white p-6 shadow rounded">
        <h2 className="text-xl font-semibold">تسجيل حساب موظف جديد</h2>

        <Input placeholder="اسم المستخدم" {...register("username", { required: "مطلوب" })} />
        {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}

        <Input placeholder="الاسم الكامل" {...register("full_name", { required: "مطلوب" })} />
        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}

        <Input type="password" placeholder="كلمة المرور" {...register("password", { required: "مطلوب" })} />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

        {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "...جاري التسجيل" : "تسجيل حساب"}
        </Button>
      </form>
    </div>
  );
}