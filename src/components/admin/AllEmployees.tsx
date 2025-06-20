"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Employee = { id: number; username: string; full_name: string; balance: number };

export default function AdminAllEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ sender_id: "", receiver_id: "", amount: "" });

  useEffect(() => {
    api
      .get("/auth/users")
      .then((res) => setEmployees(res.data))
      .catch(() => toast.error("فشل في تحميل الموظفين"));
  }, []);

  const handleTransfer = async () => {
    if (!form.sender_id || !form.receiver_id || !form.amount) {
      return toast.error("يرجى تعبئة جميع الحقول");
    }
    try {
      await api.post("/employees/transfer", {
        sender_id: +form.sender_id,
        receiver_id: +form.receiver_id,
        amount: parseFloat(form.amount),
        currency_id: 1,
      });
      toast.success("✅ تم التحويل");
      setForm({ sender_id: "", receiver_id: "", amount: "" });
      const res = await api.get("/auth/users");
      setEmployees(res.data);
    } catch {
      toast.error("خطأ أثناء التحويل");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Transfer Section */}
      <Card className="p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">نقل بين الموظفين</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={form.sender_id}
            onValueChange={(v) => setForm((f) => ({ ...f, sender_id: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="من (المرسل)" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name || emp.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={form.receiver_id}
            onValueChange={(v) => setForm((f) => ({ ...f, receiver_id: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="إلى (المستقبل)" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name || emp.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="المبلغ (LYD)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full"
          />

          <Button onClick={handleTransfer} className="md:col-span-3 w-full">
            تحويل
          </Button>
        </div>
      </Card>

      {/* Employees List */}
      <h1 className="text-2xl font-bold">قائمة الموظفين</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <Card
            key={emp.id}
            className="p-4 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold">
                {emp.full_name
                  ? emp.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : emp.username[0]}
              </div>
              <h3 className="mr-3 text-lg font-semibold">
                {emp.full_name || emp.username}
              </h3>
            </div>
            <p>
              الرصيد: <span className="font-bold">{emp.balance} LYD</span>
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
