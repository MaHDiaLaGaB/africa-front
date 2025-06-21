"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserOut = {
  id: number;
  username: string;
  full_name: string;
  role: string;
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<UserOut[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // for password editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await api.get<UserOut[]>('/auth/users');
      setEmployees(res.data);
    } catch {
      toast.error("❌ فشل في تحميل الموظفين");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChangePassword = async (userId: number) => {
    if (!newPassword || newPassword.length < 8) {
      return toast.error("كلمة المرور يجب أن تكون 8 حروف على الأقل");
    }
    setPwLoading(true);
    try {
      await api.put(`/auth/${userId}/password`, { new_password: newPassword });
      toast.success("✅ تم تغيير كلمة المرور بنجاح");
      setEditingId(null);
      setNewPassword("");
    } catch {
      toast.error("❌ فشل في تغيير كلمة المرور");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">إدارة الموظفين</h1>

      {loadingEmployees ? (
        <div className="text-center py-4">جاري التحميل…</div>
      ) : (
        <div className="space-y-4">
          {employees.map((u) => (
            <Card
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* معلومات الموظف */}
              <div>
                <div className="font-semibold text-lg">{u.full_name}</div>
                <div className="text-sm text-muted-foreground">@{u.username}</div>
              </div>

              {/* الدور */}
              <div className="text-center text-primary font-medium min-w-[80px]">
                {u.role}
              </div>

              {/* تغيير كلمة المرور */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                {editingId === u.id ? (
                  <>
                    <div className="flex flex-col w-full sm:w-48">
                      <Label htmlFor={`pw-${u.id}`}>كلمة المرور الجديدة</Label>
                      <Input
                        id={`pw-${u.id}`}
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={pwLoading}
                      />
                    </div>
                    <Button
                      className="h-8 px-3"
                      onClick={() => handleChangePassword(u.id)}
                      disabled={pwLoading}
                    >
                      {pwLoading ? "جاري الحفظ…" : "حفظ"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-3"
                      onClick={() => {
                        setEditingId(null);
                        setNewPassword("");
                      }}
                      disabled={pwLoading}
                    >
                      إلغاء
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setEditingId(u.id);
                      setNewPassword("");
                    }}
                  >
                    تغيير كلمة المرور
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
