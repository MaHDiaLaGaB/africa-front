"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserOut = { id: number; username: string; full_name: string; role: string };

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<UserOut[]>([]);
  const [form, setForm] = useState({ username: "", full_name: "", password: "" });
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/auth/users");
      setEmployees(res.data);
    } catch {
      toast.error("فشل في تحميل الموظفين");
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSubmit = async () => {
    if (!form.username || !form.full_name || !form.password) {
      return toast.error("يرجى تعبئة جميع الحقول");
    }
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("✅ تم إضافة الموظّف");
      setForm({ username: "", full_name: "", password: "" });
      fetchEmployees();
    } catch {
      toast.error("فشل في إضافة الموظّف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
      <Card className="p-6 space-y-4">
        <Label>اسم المستخدم</Label>
        <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Label>الاسم بالكامل</Label>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Label>كلمة المرور</Label>
        <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "جاري الإضافة…" : "إضافة موظّف"}
        </Button>
      </Card>

      <h2 className="text-xl font-bold mt-8">👥 قائمة الموظّفين</h2>
      <div className="space-y-2">
        {employees.map((u) => (
          <Card key={u.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{u.full_name}</div>
              <div className="text-sm text-muted-foreground">@{u.username}</div>
            </div>
            <span className="text-sm text-primary">{u.role}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
