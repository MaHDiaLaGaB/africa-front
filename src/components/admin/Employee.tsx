"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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

  // password editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // add employee state
  const [showAdd, setShowAdd] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addFullName, setAddFullName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "employee">("employee");
  const [addLoading, setAddLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await api.get<UserOut[]>("/auth/users");
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
      fetchEmployees();
    } catch {
      toast.error("❌ فشل في تغيير كلمة المرور");
    } finally {
      setPwLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!addUsername || !addFullName || !addPassword) {
      return toast.error("جميع الحقول مطلوبة");
    }
    if (addPassword.length < 8) {
      return toast.error("كلمة المرور يجب أن تكون 8 حروف على الأقل");
    }
    setAddLoading(true);
    try {
      await api.post("/auth/register", {
        username: addUsername,
        full_name: addFullName,
        password: addPassword,
        role: addRole,
      });
      toast.success("✅ تم إضافة الموظف بنجاح");
      setShowAdd(false);
      setAddUsername("");
      setAddFullName("");
      setAddPassword("");
      setAddRole("employee");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "❌ فشل في إضافة الموظف");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">إدارة الموظفين</h1>

      {/* Toggle Add Employee */}
      <Button
        variant="outline"
        onClick={() => setShowAdd(!showAdd)}
        className="mb-4"
      >
        {showAdd ? "إلغاء إضافة موظف" : "إضافة موظف جديد"}
      </Button>

      {/* Add Employee Form */}
      {showAdd && (
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">إضافة موظف جديد</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-username">اسم المستخدم</Label>
              <Input
                id="add-username"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div>
              <Label htmlFor="add-fullname">الاسم الكامل</Label>
              <Input
                id="add-fullname"
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div>
              <Label htmlFor="add-password">كلمة المرور</Label>
              <Input
                id="add-password"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div>
              <Label htmlFor="add-role">الدور</Label>
              <Select
                value={addRole}
                onValueChange={(val) => setAddRole(val as "admin" | "employee")}
                disabled={addLoading}
              >
                <SelectTrigger id="add-role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="admin">مشرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleAddEmployee}
            disabled={addLoading}
          >
            {addLoading ? "جاري الإضافة…" : "إضافة"}
          </Button>
        </Card>
      )}

      {/* Employee List */}
      {loadingEmployees ? (
        <p className="text-center py-4">جاري التحميل…</p>
      ) : (
        <div className="space-y-4">
          {employees.map((u) => (
            <Card
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* User Info */}
              <div>
                <div className="font-semibold text-lg">{u.full_name}</div>
                <div className="text-sm text-muted-foreground">@{u.username}</div>
              </div>

              {/* Role */}
              <div className="text-center text-primary font-medium min-w-[80px]">
                {u.role}
              </div>

              {/* Password Change */}
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
